import { db } from '@/db'
import { quotes, quoteItems, products, profiles, clients, clientScores, noPurchaseAlerts } from '@/db/schema'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'

export interface DateRange {
  from?: Date
  to?: Date
}

function buildDateConditions(dateRange?: DateRange) {
  const conditions = []
  if (dateRange?.from) conditions.push(gte(quotes.createdAt, dateRange.from))
  if (dateRange?.to) conditions.push(lte(quotes.createdAt, dateRange.to))
  return conditions
}

export interface SalesSummary {
  totalRevenue: number
  totalQuotes: number
  avgQuoteValue: number
  conversionRate: number | null
}

/**
 * Aggregate revenue/quote metrics for accepted quotes in the given date range.
 */
export async function getSalesSummary(dateRange?: DateRange): Promise<SalesSummary> {
  const dateConds = buildDateConditions(dateRange)
  const acceptedCond = eq(quotes.status, 'accepted')

  const whereClause =
    dateConds.length > 0 ? and(acceptedCond, ...dateConds) : acceptedCond

  const [revenueRow, countRow, totalQuotesRow, sentRow] = await Promise.all([
    // Total revenue from accepted quotes via quote_items
    db
      .select({ total: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)` })
      .from(quotes)
      .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
      .where(whereClause),

    // Count of accepted quotes
    db
      .select({ count: sql<number>`count(distinct ${quotes.id})::int` })
      .from(quotes)
      .where(whereClause),

    // Total quotes sent (for conversion denominator)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(
        dateConds.length > 0
          ? and(eq(quotes.status, 'sent'), ...dateConds)
          : eq(quotes.status, 'sent')
      ),

    // Sent count (same as totalQuotesRow — kept for clarity)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(
        dateConds.length > 0
          ? and(eq(quotes.status, 'sent'), ...dateConds)
          : eq(quotes.status, 'sent')
      ),
  ])

  const totalRevenue = Number(revenueRow[0]?.total ?? 0)
  const totalQuotes = countRow[0]?.count ?? 0
  const avgQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0
  const sentCount = totalQuotesRow[0]?.count ?? 0
  const conversionRate = sentCount > 0 ? totalQuotes / sentCount : null

  return { totalRevenue, totalQuotes, avgQuoteValue, conversionRate }
}

export interface SalespersonPerformance {
  salespersonId: string
  name: string
  quotesCreated: number
  quotesAccepted: number
  totalRevenue: number
  conversionRate: number | null
}

/**
 * Per-salesperson stats: quotes created, accepted, revenue, and conversion rate.
 */
export async function getSalespersonPerformance(): Promise<SalespersonPerformance[]> {
  // Get all salesperson profiles
  const salespersonRows = await db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.role, 'vendedor'))

  if (salespersonRows.length === 0) return []

  const results = await Promise.all(
    salespersonRows.map(async (sp) => {
      const [createdRow, acceptedRow, sentRow, revenueRow] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(quotes)
          .where(eq(quotes.salespersonId, sp.id)),

        db
          .select({ count: sql<number>`count(distinct ${quotes.id})::int` })
          .from(quotes)
          .where(and(eq(quotes.salespersonId, sp.id), eq(quotes.status, 'accepted'))),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(quotes)
          .where(and(eq(quotes.salespersonId, sp.id), eq(quotes.status, 'sent'))),

        db
          .select({ total: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)` })
          .from(quotes)
          .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
          .where(and(eq(quotes.salespersonId, sp.id), eq(quotes.status, 'accepted'))),
      ])

      const quotesCreated = createdRow[0]?.count ?? 0
      const quotesAccepted = acceptedRow[0]?.count ?? 0
      const sentCount = sentRow[0]?.count ?? 0
      const totalRevenue = Number(revenueRow[0]?.total ?? 0)
      const conversionRate = sentCount > 0 ? quotesAccepted / sentCount : null

      return {
        salespersonId: sp.id,
        name: sp.fullName,
        quotesCreated,
        quotesAccepted,
        totalRevenue,
        conversionRate,
      }
    })
  )

  return results.sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export interface TopProduct {
  productId: string
  name: string
  sku: string
  quoteCount: number
  totalQuantity: number
}

/**
 * Products ordered by how often they appear in quote items.
 */
export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  const rows = await db.execute(sql`
    SELECT
      p.id as "productId",
      p.name,
      p.sku,
      count(distinct qi.quote_id)::int as "quoteCount",
      coalesce(sum(qi.quantity), 0)::int as "totalQuantity"
    FROM quote_items qi
    INNER JOIN products p ON p.id = qi.product_id
    GROUP BY p.id, p.name, p.sku
    ORDER BY "quoteCount" DESC
    LIMIT ${limit}
  `)

  return rows as unknown as TopProduct[]
}

export interface ScoreDistribution extends Record<string, number> {
  '0-1': number
  '1-2': number
  '2-3': number
  '3-4': number
  '4-5': number
}

export interface ClientPortfolioHealth {
  totalClients: number
  activeClients: number
  atRiskClients: number
  avgScore: number
  scoreDistribution: ScoreDistribution
}

/**
 * Client portfolio health: totals, activity, at-risk count, and score distribution.
 */
export async function getClientPortfolioHealth(): Promise<ClientPortfolioHealth> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [totalRow, activeRow, atRiskRow, scoreRows] = await Promise.all([
    // Total clients
    db.select({ count: sql<number>`count(*)::int` }).from(clients),

    // Active: had an accepted quote in last 90 days
    db
      .select({ count: sql<number>`count(distinct ${quotes.clientId})::int` })
      .from(quotes)
      .where(
        and(
          eq(quotes.status, 'accepted'),
          gte(quotes.createdAt, ninetyDaysAgo)
        )
      ),

    // At risk: pending no-purchase alerts
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(noPurchaseAlerts)
      .where(eq(noPurchaseAlerts.status, 'pending')),

    // All client scores
    db.select({ score: clientScores.score }).from(clientScores),
  ])

  const totalClients = totalRow[0]?.count ?? 0
  const activeClients = activeRow[0]?.count ?? 0
  const atRiskClients = atRiskRow[0]?.count ?? 0

  const scores = scoreRows.map((r) => Number(r.score))
  const avgScore =
    scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0

  const scoreDistribution: ScoreDistribution = {
    '0-1': 0,
    '1-2': 0,
    '2-3': 0,
    '3-4': 0,
    '4-5': 0,
  }
  for (const s of scores) {
    if (s < 1) scoreDistribution['0-1']++
    else if (s < 2) scoreDistribution['1-2']++
    else if (s < 3) scoreDistribution['2-3']++
    else if (s < 4) scoreDistribution['3-4']++
    else scoreDistribution['4-5']++
  }

  return { totalClients, activeClients, atRiskClients, avgScore, scoreDistribution }
}

export interface MonthlyRevenueTrendRow {
  month: string // YYYY-MM
  revenue: number
  quoteCount: number
}

/**
 * Monthly revenue from accepted quotes, going back `months` months.
 */
export async function getMonthlyRevenueTrend(
  months = 12
): Promise<MonthlyRevenueTrendRow[]> {
  const rows = await db.execute(sql`
    SELECT
      to_char(q.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM') as month,
      coalesce(sum(qi.subtotal), 0)::numeric as revenue,
      count(distinct q.id)::int as "quoteCount"
    FROM quotes q
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    WHERE q.status = 'accepted'
      AND q.created_at >= now() - (${months} || ' months')::interval
    GROUP BY month
    ORDER BY month ASC
  `)

  return (rows as unknown as Array<{ month: string; revenue: string; quoteCount: number }>).map(
    (r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      quoteCount: r.quoteCount,
    })
  )
}
