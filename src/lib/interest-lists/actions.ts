'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { interestListItems, quoteRequests, clients, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'
import {
  getOrCreateInterestList,
  getClientIdByProfileId,
  getInterestListWithItems,
} from './queries'
import { getUser } from '@/lib/auth/get-user'
import {
  sendNewQuoteRequestEmail,
  getSalespersonEmail,
} from '@/lib/email/send'
import { notify } from '@/lib/notifications'

async function getAuthClientId(): Promise<string | null> {
  const user = await getUser()
  if (!user) return null
  return getClientIdByProfileId(user.id)
}

export async function addToInterestList(
  productId: string,
  quantity = 1,
  notes?: string
): Promise<ActionResult<{ itemId: string }>> {
  try {
    const clientId = await getAuthClientId()
    if (!clientId) return { success: false, error: 'Autenticación requerida', code: 'UNAUTHENTICATED' }

    const list = await getOrCreateInterestList(clientId)

    const [item] = await db
      .insert(interestListItems)
      .values({
        interestListId: list.id,
        productId,
        quantity,
        notes: notes ?? null,
      })
      .returning({ id: interestListItems.id })

    revalidatePath('/mi-lista')
    return { success: true, data: { itemId: item.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function removeFromInterestList(itemId: string): Promise<ActionResult<void>> {
  try {
    await db.delete(interestListItems).where(eq(interestListItems.id, itemId))
    revalidatePath('/mi-lista')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateItemQuantity(
  itemId: string,
  quantity: number
): Promise<ActionResult<void>> {
  try {
    if (quantity < 1) return { success: false, error: 'La cantidad debe ser al menos 1' }

    await db
      .update(interestListItems)
      .set({ quantity })
      .where(eq(interestListItems.id, itemId))

    revalidatePath('/mi-lista')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function requestQuote(interestListId: string, vendedorId?: string): Promise<ActionResult<{ requestId: string }>> {
  try {
    const clientId = await getAuthClientId()
    if (!clientId) return { success: false, error: 'Autenticación requerida', code: 'UNAUTHENTICATED' }

    // Verify list has items
    const listWithItems = await getInterestListWithItems(clientId)
    if (!listWithItems || listWithItems.items.length === 0) {
      return { success: false, error: 'Tu carrito está vacío' }
    }

    const [req] = await db
      .insert(quoteRequests)
      .values({
        interestListId,
        clientId,
        assignedTo: vendedorId ?? null,
        status: 'pending',
      })
      .returning({ id: quoteRequests.id })

    // Notify assigned salesperson — non-blocking
    const clientRows = await db
      .select({
        razonSocial: clients.razonSocial,
        profileId: clients.profileId,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    const clientName = clientRows[0]?.razonSocial ?? 'Client'
    const productCount = listWithItems.items.length

    const salespersonId = vendedorId ?? null
    if (salespersonId) {
      getSalespersonEmail(salespersonId)
        .then((email) => {
          if (email) {
            sendNewQuoteRequestEmail(email, clientName, productCount).catch(() => {})
          }
        })
        .catch(() => {})
    }

    // In-app notification — fire-and-forget
    notify('new_quote_request', {
      requestId: req.id,
      clientId,
      clientName,
      productCount,
    }).catch(() => {})

    revalidatePath('/mi-lista')
    return { success: true, data: { requestId: req.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
