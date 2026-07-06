'use server'

import { db } from '@/db'
import { clients, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { validateCuitAfip } from '@/lib/afip/index'
import { getCachedAfipResult, setCachedAfipResult } from '@/lib/afip/cache'
import { checkCuitBcra, deriveBcraRiskLevel } from '@/lib/bcra/index'
import { getCachedBcraResult, setCachedBcraResult } from '@/lib/bcra/cache'
import { isValidCuit } from '@/lib/utils/cuit'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types/action-result'
import { revalidatePath } from 'next/cache'
import { notify } from '@/lib/notifications'

function toTitleCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export interface RegisterClientInput {
  email: string
  password: string
  fullName: string
  cuit: string
  phone?: string
  companyName?: string
}

export interface RegisterClientResult {
  profileId: string
  clientId: string
  validationStatus: 'validated' | 'pending_validation'
  message: string
}

/**
 * Full customer registration:
 * 1. Validate CUIT format
 * 2. Create Supabase auth user
 * 3. Insert profiles row (role = 'cliente')
 * 4. Insert clients row
 * 5. Fire AFIP + BCRA validation (non-blocking after commit)
 */
export async function registerClient(
  input: RegisterClientInput
): Promise<ActionResult<RegisterClientResult>> {
  const { email, password, cuit, phone } = input
  const fullName = toTitleCase(input.fullName)
  const companyName = input.companyName ? toTitleCase(input.companyName) : undefined

  // Step 1: validate CUIT format before any external call
  if (!isValidCuit(cuit)) {
    return {
      success: false,
      error: 'El formato del CUIT es inválido. Por favor verificá el número e intentá de nuevo.',
      code: 'INVALID_CUIT',
    }
  }

  // Step 2: check if CUIT already registered
  const existing = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.cuit, cuit))
    .limit(1)

  if (existing.length > 0) {
    return {
      success: false,
      error: 'Este CUIT ya está registrado.',
      code: 'CUIT_ALREADY_EXISTS',
    }
  }

  // Step 3: create Supabase auth user
  const adminSupabase = createAdminClient()
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  })

  if (authError || !authData?.user) {
    return {
      success: false,
      error: authError?.message ?? 'No se pudo crear la cuenta de usuario.',
      code: 'AUTH_ERROR',
    }
  }

  const profileId = authData.user.id

  try {
    // Step 4: insert profiles row
    await db.insert(profiles).values({
      id: profileId,
      fullName,
      companyName: companyName ?? null,
      phone: phone ?? null,
      role: 'cliente',
    })

    // Step 5: insert clients row with pending validation
    const [client] = await db
      .insert(clients)
      .values({
        profileId,
        cuit,
        afipStatus: 'pending',
        bcraStatus: 'pending',
        validationPending: true,
      })
      .returning({ id: clients.id })

    // Step 6: fire-and-forget AFIP + BCRA validation
    // We do NOT await — registration succeeds regardless
    validateClientCuit(client.id).catch((err) => {
      console.error('[VALIDATION] Background validation failed:', err)
    })

    // Step 7: notify admins of new pending activation
    notify('client_pending_activation', {
      clientId: client.id,
      clientName: fullName,
    }).catch(() => null)

    return {
      success: true,
      data: {
        profileId,
        clientId: client.id,
        validationStatus: 'pending_validation',
        message:
          'Cuenta creada. Estamos verificando tu CUIT en segundo plano y actualizaremos tu estado en breve.',
      },
    }
  } catch (err) {
    // If DB insert fails, clean up the auth user
    await adminSupabase.auth.admin.deleteUser(profileId).catch(() => null)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'El registro falló de forma inesperada.',
      code: 'DB_ERROR',
    }
  }
}

/**
 * Runs AFIP + BCRA validation for a client and updates their record.
 * Called in background after registration; also available for manual re-validation.
 */
export async function validateClientCuit(clientId: string): Promise<void> {
  const rows = await db
    .select({ cuit: clients.cuit })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)

  const row = rows[0]
  if (!row) return

  const { cuit } = row

  const [afipResult, bcraResult] = await Promise.all([
    (async () => {
      const cached = await getCachedAfipResult(cuit)
      if (cached) return cached
      const fresh = await validateCuitAfip(cuit)
      await setCachedAfipResult(cuit, fresh)
      return fresh
    })(),
    (async () => {
      const cached = await getCachedBcraResult(cuit)
      if (cached) return cached
      const fresh = await checkCuitBcra(cuit)
      await setCachedBcraResult(cuit, fresh)
      return fresh
    })(),
  ])

  const afipStatus = afipResult.valid
    ? 'validated'
    : afipResult.reason === 'api_error'
      ? 'pending'
      : 'invalid'

  const bcraRisk = deriveBcraRiskLevel(bcraResult)
  const bcraStatus = !bcraResult.found
    ? bcraResult.reason === 'api_error'
      ? 'unavailable'
      : 'clear'
    : bcraRisk === 'normal'
      ? 'clear'
      : 'risk'

  const razonSocial =
    afipResult.valid
      ? (afipResult.persona.razonSocial ?? afipResult.persona.nombre ?? null)
      : undefined

  await db
    .update(clients)
    .set({
      afipStatus: afipStatus as 'validated' | 'pending' | 'invalid',
      afipCachedAt: new Date(),
      bcraStatus: bcraStatus as 'clear' | 'risk' | 'pending' | 'unavailable',
      bcraCachedAt: new Date(),
      bcraRiskLevel: bcraRisk,
      razonSocial: razonSocial ?? undefined,
      validationPending: afipStatus === 'pending',
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId))
}

/**
 * Re-validates a client regardless of cache TTL.
 * Admin-only operation.
 */
export async function revalidateClient(
  clientId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    // Fetch cuit and bypass cache — update cached_at to force re-fetch
    const rows = await db
      .select({ cuit: clients.cuit })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Cliente no encontrado', code: 'NOT_FOUND' }

    // Reset timestamps to force fresh fetch
    await db
      .update(clients)
      .set({ afipCachedAt: null, bcraCachedAt: null })
      .where(eq(clients.id, clientId))

    await validateClientCuit(clientId)

    revalidatePath(`/admin/clientes/${clientId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'La revalidación falló',
    }
  }
}

/**
 * Updates editable client fields (profile + client row).
 */
export async function updateClient(
  clientId: string,
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ profileId: clients.profileId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Cliente no encontrado', code: 'NOT_FOUND' }

    const fullName = toTitleCase(formData.get('fullName') as string)
    const companyName = formData.get('companyName') ? toTitleCase(formData.get('companyName') as string) : null
    const phone = formData.get('phone') as string | null
    const razonSocial = formData.get('razonSocial') as string | null
    const cuit = formData.get('cuit') as string
    const industry = formData.get('industry') as string | null

    if (!isValidCuit(cuit)) {
      return { success: false, error: 'El formato del CUIT es inválido.', code: 'INVALID_CUIT' }
    }

    await db
      .update(profiles)
      .set({
        fullName,
        companyName: companyName || null,
        phone: phone || null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, rows[0].profileId))

    await db
      .update(clients)
      .set({
        cuit,
        razonSocial: razonSocial || null,
        industry: industry || null,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))

    revalidatePath(`/admin/clientes/${clientId}`)
    revalidatePath('/admin/clientes')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'La actualización falló',
    }
  }
}

/**
 * Normalizes fullName and companyName for all existing clients (Title Case).
 */
export async function normalizeClientNames(): Promise<ActionResult<{ updated: number }>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ id: profiles.id, fullName: profiles.fullName, companyName: profiles.companyName })
      .from(profiles)

    let updated = 0
    for (const row of rows) {
      const normalizedFullName = row.fullName ? toTitleCase(row.fullName) : row.fullName
      const normalizedCompanyName = row.companyName ? toTitleCase(row.companyName) : row.companyName

      if (normalizedFullName !== row.fullName || normalizedCompanyName !== row.companyName) {
        await db
          .update(profiles)
          .set({ fullName: normalizedFullName ?? '', companyName: normalizedCompanyName, updatedAt: new Date() })
          .where(eq(profiles.id, row.id))
        updated++
      }
    }

    revalidatePath('/admin/clientes')
    return { success: true, data: { updated } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'La normalización falló',
    }
  }
}

/**
 * Activates a client account by confirming their email in Supabase Auth.
 */
export async function activateClientAccount(clientId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ profileId: clients.profileId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Cliente no encontrado', code: 'NOT_FOUND' }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(rows[0].profileId, {
      email_confirm: true,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/admin/clientes/${clientId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo activar la cuenta',
    }
  }
}

/**
 * Deletes a client and their auth user (cascades to profile + client rows).
 */
export async function deleteClient(clientId: string): Promise<void> {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const rows = await db
    .select({ profileId: clients.profileId })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)

  if (!rows[0]) throw new Error('Cliente no encontrado')

  const { profileId } = rows[0]

  // Delete DB rows first (clients cascades from profiles)
  await db.delete(clients).where(eq(clients.id, clientId))
  await db.delete(profiles).where(eq(profiles.id, profileId))

  // Then delete the auth user
  const adminSupabase = createAdminClient()
  await adminSupabase.auth.admin.deleteUser(profileId)

  revalidatePath('/admin/clientes')
  redirect('/admin/clientes')
}

/**
 * Assigns a vendedor to a client.
 */
export async function assignVendedor(
  clientId: string,
  vendedorId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ profileId: clients.profileId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Cliente no encontrado', code: 'NOT_FOUND' }

    await db
      .update(profiles)
      .set({ assignedSalespersonId: vendedorId })
      .where(eq(profiles.id, rows[0].profileId))

    revalidatePath(`/admin/clientes/${clientId}`)
    revalidatePath('/admin/clientes')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'La asignación falló',
    }
  }
}

