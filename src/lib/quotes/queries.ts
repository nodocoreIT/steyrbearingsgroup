import { db } from '@/db'
import {
  quotes,
  quoteItems,
  quoteApprovalLog,
  clients,
  profiles,
  products,
  quoteRequests,
} from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function getQuoteById(id: string) {
  const rows = await db
    .select({
      // Quote fields
      id: quotes.id,
      status: quotes.status,
      notes: quotes.notes,
      approvedBy: quotes.approvedBy,
      approvedAt: quotes.approvedAt,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
      // Client
      clientId: quotes.clientId,
      clientName: clients.razonSocial,
      clientProfileId: clients.profileId,
      // Salesperson
      salespersonId: quotes.salespersonId,
      salespersonName: profiles.fullName,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .innerJoin(profiles, eq(profiles.id, quotes.salespersonId))
    .where(eq(quotes.id, id))
    .limit(1)

  const quote = rows[0]
  if (!quote) return null

  const items = await getQuoteItems(id)

  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0)

  return { ...quote, items, total }
}

export async function getQuoteItems(quoteId: string) {
  return db
    .select({
      id: quoteItems.id,
      quoteId: quoteItems.quoteId,
      productId: quoteItems.productId,
      quantity: quoteItems.quantity,
      unitPrice: quoteItems.unitPrice,
      marginPercent: quoteItems.marginPercent,
      subtotal: quoteItems.subtotal,
      productName: products.name,
      productSku: products.sku,
    })
    .from(quoteItems)
    .innerJoin(products, eq(products.id, quoteItems.productId))
    .where(eq(quoteItems.quoteId, quoteId))
    .orderBy(quoteItems.id)
}

export interface GetAllQuotesOptions {
  status?: string
  salesPersonId?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export async function getAllQuotes(opts: GetAllQuotesOptions = {}) {
  const { status, salesPersonId, clientId, page = 1, pageSize = 20 } = opts
  const offset = (page - 1) * pageSize

  const conditions = []
  if (status) conditions.push(eq(quotes.status, status as typeof quotes.status._.data))
  if (salesPersonId) conditions.push(eq(quotes.salespersonId, salesPersonId))
  if (clientId) conditions.push(eq(quotes.clientId, clientId))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      id: quotes.id,
      status: quotes.status,
      notes: quotes.notes,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
      clientId: quotes.clientId,
      clientName: clients.razonSocial,
      salespersonId: quotes.salespersonId,
      salespersonName: profiles.fullName,
      itemCount: sql<number>`count(${quoteItems.id})::int`,
      total: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)`,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .innerJoin(profiles, eq(profiles.id, quotes.salespersonId))
    .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
    .where(where)
    .groupBy(quotes.id, clients.razonSocial, profiles.fullName)
    .orderBy(desc(quotes.createdAt))
    .limit(pageSize)
    .offset(offset)

  return rows
}

export async function getQuotesByClient(clientId: string) {
  return getAllQuotes({ clientId })
}

export async function getQuoteApprovalLog(quoteId: string) {
  return db
    .select({
      id: quoteApprovalLog.id,
      quoteId: quoteApprovalLog.quoteId,
      action: quoteApprovalLog.action,
      notes: quoteApprovalLog.notes,
      performedAt: quoteApprovalLog.performedAt,
      actorId: quoteApprovalLog.performedBy,
      actorName: profiles.fullName,
    })
    .from(quoteApprovalLog)
    .innerJoin(profiles, eq(profiles.id, quoteApprovalLog.performedBy))
    .where(eq(quoteApprovalLog.quoteId, quoteId))
    .orderBy(quoteApprovalLog.performedAt)
}

export async function getPendingQuoteRequests() {
  return db
    .select({
      id: quoteRequests.id,
      interestListId: quoteRequests.interestListId,
      clientId: quoteRequests.clientId,
      status: quoteRequests.status,
      createdAt: quoteRequests.createdAt,
      clientName: clients.razonSocial,
      clientProfileId: clients.profileId,
    })
    .from(quoteRequests)
    .innerJoin(clients, eq(clients.id, quoteRequests.clientId))
    .where(eq(quoteRequests.status, 'pending'))
    .orderBy(desc(quoteRequests.createdAt))
}
