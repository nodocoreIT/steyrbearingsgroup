import { db } from '@/db'
import { quotes, quoteItems, clients, profiles } from '@/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'
import type { DateRange } from './dashboard'

export interface VendedorStats {
  quotesCreated: number
  quotesAccepted: number
  quotesPending: number
  quotesRejected: number
  totalRevenue: number
  conversionRate: number | null
  avgResponseTime: number | null // days from draft to sent, or null if not enough data
  topClients: Array<{ clientId: string; name: string; revenue: number }>
}

/**
 * Full stats for one salesperson, optionally filtered by date range.
 */
export async function getVendedorStats(
  vendedorId: string,
  dateRange?: DateRange
): Promise<VendedorStats> {
  const baseConds = [eq(quotes.salespersonId, vendedorId)]
  if (dateRange?.from) baseConds.push(gte(quotes.createdAt, dateRange.from))

  const [createdRow, acceptedRow, pendingRow, rejectedRow, sentRow, revenueRow] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quotes)
        .where(and(...baseConds)),

      db
        .select({ count: sql<number>`count(distinct ${quotes.id})::int` })
        .from(quotes)
        .where(and(...baseConds, eq(quotes.status, 'accepted'))),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quotes)
        .where(and(...baseConds, eq(quotes.status, 'pending_approval'))),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quotes)
        .where(and(...baseConds, eq(quotes.status, 'rejected'))),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quotes)
        .where(and(...baseConds, eq(quotes.status, 'sent'))),

      db
        .select({ total: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)` })
        .from(quotes)
        .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
        .where(and(...baseConds, eq(quotes.status, 'accepted'))),
    ])

  const quotesCreated = createdRow[0]?.count ?? 0
  const quotesAccepted = acceptedRow[0]?.count ?? 0
  const quotesPending = pendingRow[0]?.count ?? 0
  const quotesRejected = rejectedRow[0]?.count ?? 0
  const sentCount = sentRow[0]?.count ?? 0
  const totalRevenue = Number(revenueRow[0]?.total ?? 0)
  const conversionRate = sentCount > 0 ? quotesAccepted / sentCount : null

  // Top 5 clients by revenue from accepted quotes
  const topClientsRows = await db.execute(sql`
    SELECT
      c.id as "clientId",
      c.razon_social as name,
      coalesce(sum(qi.subtotal), 0)::numeric as revenue
    FROM quotes q
    INNER JOIN clients c ON c.id = q.client_id
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    WHERE q.salesperson_id = ${vendedorId}
      AND q.status = 'accepted'
    GROUP BY c.id, c.razon_social
    ORDER BY revenue DESC
    LIMIT 5
  `)

  const topClients = (
    topClientsRows as unknown as Array<{ clientId: string; name: string | null; revenue: string }>
  ).map((r) => ({
    clientId: r.clientId,
    name: r.name ?? r.clientId.slice(0, 8),
    revenue: Number(r.revenue),
  }))

  return {
    quotesCreated,
    quotesAccepted,
    quotesPending,
    quotesRejected,
    totalRevenue,
    conversionRate,
    avgResponseTime: null, // requires sent_at / draft timestamps not in schema — deferred
    topClients,
  }
}

export interface VendedorRankingRow {
  salespersonId: string
  name: string
  totalRevenue: number
  quotesAccepted: number
}

/**
 * All salespersons ranked by revenue in the last 30 days.
 */
export async function getVendedorRanking(): Promise<VendedorRankingRow[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const rows = await db.execute(sql`
    SELECT
      p.id as "salespersonId",
      p.full_name as name,
      coalesce(sum(qi.subtotal), 0)::numeric as "totalRevenue",
      count(distinct q.id)::int as "quotesAccepted"
    FROM profiles p
    LEFT JOIN quotes q ON q.salesperson_id = p.id
      AND q.status = 'accepted'
      AND q.created_at >= ${thirtyDaysAgo.toISOString()}
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    WHERE p.role = 'vendedor'
    GROUP BY p.id, p.full_name
    ORDER BY "totalRevenue" DESC
  `)

  return (
    rows as unknown as Array<{
      salespersonId: string
      name: string
      totalRevenue: string
      quotesAccepted: number
    }>
  ).map((r) => ({
    salespersonId: r.salespersonId,
    name: r.name,
    totalRevenue: Number(r.totalRevenue),
    quotesAccepted: r.quotesAccepted,
  }))
}

export interface VendedorQuoteHistoryRow {
  quoteId: string
  clientName: string | null
  status: string
  total: number
  createdAt: Date
}

/**
 * Last 20 quotes for a salesperson with client name and total value.
 */
export async function getVendedorQuoteHistory(
  vendedorId: string
): Promise<VendedorQuoteHistoryRow[]> {
  const rows = await db.execute(sql`
    SELECT
      q.id as "quoteId",
      c.razon_social as "clientName",
      q.status,
      coalesce(sum(qi.subtotal), 0)::numeric as total,
      q.created_at as "createdAt"
    FROM quotes q
    INNER JOIN clients c ON c.id = q.client_id
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    WHERE q.salesperson_id = ${vendedorId}
    GROUP BY q.id, c.razon_social, q.status, q.created_at
    ORDER BY q.created_at DESC
    LIMIT 20
  `)

  return (
    rows as unknown as Array<{
      quoteId: string
      clientName: string | null
      status: string
      total: string
      createdAt: string
    }>
  ).map((r) => ({
    quoteId: r.quoteId,
    clientName: r.clientName,
    status: r.status,
    total: Number(r.total),
    createdAt: new Date(r.createdAt),
  }))
}

/**
 * Last activity date for a salesperson (most recent quote created_at).
 */
export async function getVendedorLastActivity(vendedorId: string): Promise<Date | null> {
  const rows = await db
    .select({ createdAt: quotes.createdAt })
    .from(quotes)
    .where(eq(quotes.salespersonId, vendedorId))
    .orderBy(desc(quotes.createdAt))
    .limit(1)

  return rows[0]?.createdAt ?? null
}
