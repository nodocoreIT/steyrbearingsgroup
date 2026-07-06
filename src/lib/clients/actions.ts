'use server'

import { db } from '@/db'
import { clients, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateCuitAfip } from '@/lib/afip/index'
import { getCachedAfipResult, setCachedAfipResult } from '@/lib/afip/cache'
import { checkCuitBcra, deriveBcraRiskLevel } from '@/lib/bcra/index'
import { getCachedBcraResult, setCachedBcraResult } from '@/lib/bcra/cache'
import { isValidCuit } from '@/lib/utils/cuit'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types/action-result'
import { revalidatePath } from 'next/cache'

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
  const { email, password, fullName, cuit, phone, companyName } = input

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

