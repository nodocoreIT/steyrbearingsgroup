'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import {
  quotes,
  quoteItems,
  quoteApprovalLog,
  clients,
  quoteRequests,
  interestListItems,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'
import { getUser, requireAdmin } from '@/lib/auth/get-user'
import { canApproveQuotes } from '@/lib/auth/roles'
import { getEffectiveMargin } from '@/lib/pricing/queries'
import { getProductById } from '@/lib/products/queries'
import { getQuoteApprovalLog } from './queries'
import {
  sendQuoteApprovedEmail,
  sendQuoteSentEmail,
  getClientEmail,
} from '@/lib/email/send'
import { notify } from '@/lib/notifications'

// ─── Quote creation & editing ────────────────────────────────────────────────

export async function createQuote(clientId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const [quote] = await db
      .insert(quotes)
      .values({
        clientId,
        salespersonId: user.id,
        status: 'draft',
      })
      .returning({ id: quotes.id })

    revalidatePath('/admin/presupuestos')
    return { success: true, data: { id: quote.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el presupuesto',
    }
  }
}

export async function addQuoteItem(
  quoteId: string,
  productId: string,
  quantity: number
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    // Load the quote to get clientId
    const quoteRows = await db
      .select({ clientId: quotes.clientId, status: quotes.status })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    const quote = quoteRows[0]
    if (!quote) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (quote.status !== 'draft') {
      return { success: false, error: 'Solo se pueden editar presupuestos en borrador', code: 'INVALID_STATUS' }
    }

    // Get product base price — we treat product cost as unit_price base
    // In this schema there is no separate cost field; unit_price IS the final price after margin
    const product = await getProductById(productId)
    if (!product) return { success: false, error: 'Producto no encontrado', code: 'NOT_FOUND' }

    // Get effective margin from client's price list
    const pricing = await getEffectiveMargin(productId, quote.clientId)
    const marginPercent = pricing.marginPercent

    // unit_price here represents the list price (cost * (1 + margin/100))
    // We store 0 as base cost since the schema has no cost field;
    // in real use the salesperson adjusts via updateQuoteItem.
    const baseUnitPrice = 0
    const unitPrice = baseUnitPrice * (1 + marginPercent / 100)
    const subtotal = unitPrice * quantity

    const [item] = await db
      .insert(quoteItems)
      .values({
        quoteId,
        productId,
        quantity,
        unitPrice: String(unitPrice),
        marginPercent: String(marginPercent),
        subtotal: String(subtotal),
      })
      .returning({ id: quoteItems.id })

    // Update quote updatedAt
    await db
      .update(quotes)
      .set({ updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos/nuevo')
    return { success: true, data: { id: item.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo agregar el ítem',
    }
  }
}

export async function updateQuoteItem(
  itemId: string,
  updates: { quantity?: number; unitPrice?: number; marginPercent?: number }
): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({
        quantity: quoteItems.quantity,
        unitPrice: quoteItems.unitPrice,
        marginPercent: quoteItems.marginPercent,
        quoteId: quoteItems.quoteId,
      })
      .from(quoteItems)
      .where(eq(quoteItems.id, itemId))
      .limit(1)

    const item = rows[0]
    if (!item) return { success: false, error: 'Ítem no encontrado', code: 'NOT_FOUND' }

    const newQuantity = updates.quantity ?? item.quantity
    const newUnitPrice = updates.unitPrice ?? Number(item.unitPrice)
    const newMarginPercent = updates.marginPercent ?? Number(item.marginPercent)
    const newSubtotal = newUnitPrice * newQuantity

    await db
      .update(quoteItems)
      .set({
        quantity: newQuantity,
        unitPrice: String(newUnitPrice),
        marginPercent: String(newMarginPercent),
        subtotal: String(newSubtotal),
      })
      .where(eq(quoteItems.id, itemId))

    await db
      .update(quotes)
      .set({ updatedAt: new Date() })
      .where(eq(quotes.id, item.quoteId))

    revalidatePath(`/admin/presupuestos/${item.quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el ítem',
    }
  }
}

export async function removeQuoteItem(itemId: string): Promise<ActionResult<void>> {
  try {
    const rows = await db
      .select({ quoteId: quoteItems.quoteId })
      .from(quoteItems)
      .where(eq(quoteItems.id, itemId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Ítem no encontrado', code: 'NOT_FOUND' }

    await db.delete(quoteItems).where(eq(quoteItems.id, itemId))

    await db
      .update(quotes)
      .set({ updatedAt: new Date() })
      .where(eq(quotes.id, rows[0].quoteId))

    revalidatePath(`/admin/presupuestos/${rows[0].quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar el ítem',
    }
  }
}

export async function updateQuoteNotes(
  quoteId: string,
  notes: string
): Promise<ActionResult<void>> {
  try {
    await db.update(quotes).set({ notes, updatedAt: new Date() }).where(eq(quotes.id, quoteId))
    revalidatePath(`/admin/presupuestos/${quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudieron actualizar las notas',
    }
  }
}

export async function submitQuoteForApproval(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ status: quotes.status })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (rows[0].status !== 'draft') {
      return { success: false, error: 'Solo se pueden enviar a revisión presupuestos en borrador', code: 'INVALID_STATUS' }
    }

    await db
      .update(quotes)
      .set({ status: 'pending_approval', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'submitted',
      performedBy: user.id,
      notes: null,
    })

    // Notification placeholder — Slice 6 wires real notifications
    console.log(`[NOTIFICATION] Quote ${quoteId} submitted for approval by ${user.id}`)

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo enviar el presupuesto a revisión',
    }
  }
}

// ─── Approval flow ────────────────────────────────────────────────────────────

export async function approveQuote(quoteId: string, notes?: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }
    if (!canApproveQuotes(user.role)) {
      return { success: false, error: 'Prohibido: se requiere rol de administrador', code: 'FORBIDDEN' }
    }

    const rows = await db
      .select({ status: quotes.status, clientId: quotes.clientId })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (rows[0].status !== 'pending_approval') {
      return {
        success: false,
        error: 'El presupuesto no está pendiente de aprobación',
        code: 'INVALID_STATUS',
      }
    }

    await db
      .update(quotes)
      .set({
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'approved',
      performedBy: user.id,
      notes: notes ?? null,
    })

    // Notify client via email — non-blocking
    getClientEmail(rows[0].clientId)
      .then((email) => {
        if (email) {
          sendQuoteApprovedEmail(email, quoteId).catch(() => {})
        }
      })
      .catch(() => {})

    // In-app notification — fire-and-forget
    notify('quote_approved', { quoteId, clientId: rows[0].clientId }).catch(() => {})

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo aprobar el presupuesto',
    }
  }
}

export async function rejectQuote(
  quoteId: string,
  reason: string
): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }
    if (!canApproveQuotes(user.role)) {
      return { success: false, error: 'Prohibido: se requiere rol de administrador', code: 'FORBIDDEN' }
    }

    await db
      .update(quotes)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'rejected',
      performedBy: user.id,
      notes: reason,
    })

    // In-app notification — fire-and-forget
    notify('quote_rejected', { quoteId }).catch(() => {})

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo rechazar el presupuesto',
    }
  }
}

export async function sendQuoteToClient(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ status: quotes.status, clientId: quotes.clientId })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (rows[0].status !== 'approved') {
      return {
        success: false,
        error: 'Solo se pueden enviar presupuestos aprobados',
        code: 'INVALID_STATUS',
      }
    }

    await db
      .update(quotes)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'sent',
      performedBy: user.id,
      notes: null,
    })

    // Notify client via email — non-blocking
    getClientEmail(rows[0].clientId)
      .then((email) => {
        if (email) {
          sendQuoteSentEmail(email, quoteId).catch(() => {})
        }
      })
      .catch(() => {})

    // In-app notification — fire-and-forget
    notify('quote_sent', { quoteId, clientId: rows[0].clientId }).catch(() => {})

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo enviar el presupuesto',
    }
  }
}

// ─── Client portal actions ────────────────────────────────────────────────────

export async function clientAcceptQuote(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    await db
      .update(quotes)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath(`/mis-presupuestos/${quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo aceptar el presupuesto',
    }
  }
}

export async function clientDeclineQuote(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    await db
      .update(quotes)
      .set({ status: 'declined', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath(`/mis-presupuestos/${quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo declinar el presupuesto',
    }
  }
}

// ─── Quote request conversion ─────────────────────────────────────────────────

export async function convertQuoteRequest(
  quoteRequestId: string
): Promise<ActionResult<{ quoteId: string }>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    // Load the quote request
    const requestRows = await db
      .select({
        id: quoteRequests.id,
        clientId: quoteRequests.clientId,
        interestListId: quoteRequests.interestListId,
        status: quoteRequests.status,
      })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1)

    const request = requestRows[0]
    if (!request) return { success: false, error: 'Solicitud de presupuesto no encontrada', code: 'NOT_FOUND' }
    if (request.status !== 'pending') {
      return {
        success: false,
        error: 'La solicitud de presupuesto no está pendiente',
        code: 'INVALID_STATUS',
      }
    }

    // Create draft quote
    const [quote] = await db
      .insert(quotes)
      .values({
        clientId: request.clientId,
        salespersonId: user.id,
        status: 'draft',
      })
      .returning({ id: quotes.id })

    // Pre-populate items from interest list
    const items = await db
      .select({
        productId: interestListItems.productId,
        quantity: interestListItems.quantity,
      })
      .from(interestListItems)
      .where(eq(interestListItems.interestListId, request.interestListId))

    if (items.length > 0) {
      const itemInserts = await Promise.all(
        items.map(async (item) => {
          const pricing = await getEffectiveMargin(item.productId, request.clientId)
          const unitPrice = 0 // salesperson sets actual price
          const subtotal = unitPrice * item.quantity
          return {
            quoteId: quote.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: String(unitPrice),
            marginPercent: String(pricing.marginPercent),
            subtotal: String(subtotal),
          }
        })
      )

      await db.insert(quoteItems).values(itemInserts)
    }

    // Mark quote request as in_progress
    await db
      .update(quoteRequests)
      .set({ status: 'in_progress' })
      .where(eq(quoteRequests.id, quoteRequestId))

    revalidatePath('/admin/presupuestos')
    return { success: true, data: { quoteId: quote.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo convertir la solicitud en presupuesto',
    }
  }
}
