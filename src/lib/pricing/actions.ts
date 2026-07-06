'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { priceLists, priceListRules, clients, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'
import { requireAdmin } from '@/lib/auth/get-user'

export interface CreatePriceListInput {
  name: string
  description?: string
}

export async function createPriceList(
  data: CreatePriceListInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAdmin()

    const [list] = await db
      .insert(priceLists)
      .values({
        name: data.name,
        description: data.description ?? null,
        createdBy: user.id,
      })
      .returning({ id: priceLists.id })

    revalidatePath('/admin/precios')
    return { success: true, data: { id: list.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear la lista de precios',
    }
  }
}

export interface AddPriceListRuleInput {
  productId?: string
  categoryId?: string
  marginPercent: number
}

export async function addPriceListRule(
  priceListId: string,
  input: AddPriceListRuleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    if (!input.productId && !input.categoryId) {
      return {
        success: false,
        error: 'Una regla debe apuntar a un producto o a una categoría',
        code: 'INVALID_RULE',
      }
    }

    const [rule] = await db
      .insert(priceListRules)
      .values({
        priceListId,
        productId: input.productId ?? null,
        categoryId: input.categoryId ?? null,
        marginPercent: String(input.marginPercent),
      })
      .returning({ id: priceListRules.id })

    revalidatePath(`/admin/precios/${priceListId}`)
    revalidatePath('/admin/precios')
    return { success: true, data: { id: rule.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo agregar la regla',
    }
  }
}

export async function updatePriceListRule(
  ruleId: string,
  marginPercent: number
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ priceListId: priceListRules.priceListId })
      .from(priceListRules)
      .where(eq(priceListRules.id, ruleId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Regla no encontrada', code: 'NOT_FOUND' }

    await db
      .update(priceListRules)
      .set({ marginPercent: String(marginPercent) })
      .where(eq(priceListRules.id, ruleId))

    revalidatePath(`/admin/precios/${rows[0].priceListId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar la regla',
    }
  }
}

export async function deletePriceListRule(ruleId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ priceListId: priceListRules.priceListId })
      .from(priceListRules)
      .where(eq(priceListRules.id, ruleId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Regla no encontrada', code: 'NOT_FOUND' }

    await db.delete(priceListRules).where(eq(priceListRules.id, ruleId))

    revalidatePath(`/admin/precios/${rows[0].priceListId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar la regla',
    }
  }
}

export async function assignPriceListToClient(
  clientId: string,
  priceListId: string
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Cliente no encontrado', code: 'NOT_FOUND' }

    await db.update(clients).set({ priceListId }).where(eq(clients.id, clientId))

    revalidatePath(`/admin/clientes/${clientId}`)
    revalidatePath('/admin/precios')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo asignar la lista de precios',
    }
  }
}

export async function assignPriceListToVendedor(
  vendedorId: string,
  priceListId: string
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const rows = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, vendedorId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Vendedor no encontrado', code: 'NOT_FOUND' }

    await db
      .update(profiles)
      .set({ defaultPriceListId: priceListId })
      .where(eq(profiles.id, vendedorId))

    revalidatePath('/admin/precios')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo asignar la lista de precios al vendedor',
    }
  }
}
