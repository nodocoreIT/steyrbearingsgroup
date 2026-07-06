import { db } from '@/db'
import { quotes, quoteItems } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export interface DateRange {
  from?: Date
  to?: Date
}

function buildConditions(
  vendedorId?: string,
  dateRange?: DateRange
) {
  const conditions = []
  if (vendedorId) conditions.push(eq(quotes.salespersonId, vendedorId))
  if (dateRange?.from) conditions.push(gte(quotes.createdAt, dateRange.from))
  if (dateRange?.to) conditions.push(lte(quotes.createdAt, dateRange.to))
  return conditions
}

/**
 * Ratio: accepted / sent quotes.
 * Returns a number between 0 and 1, or null if no sent quotes exist.
 */
export async function getQuoteConversionRate(
  vendedorId?: string,
  dateRange?: DateRange
): Promise<number | null> {
  const baseConditions = buildConditions(vendedorId, dateRange)

  const [sentRows, acceptedRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(
        baseConditions.length > 0
          ? and(...baseConditions, eq(quotes.status, 'sent'))
          : eq(quotes.status, 'sent')
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(
        baseConditions.length > 0
          ? and(...baseConditions, eq(quotes.status, 'accepted'))
          : eq(quotes.status, 'accepted')
      ),
  ])

  const sentCount = sentRows[0]?.count ?? 0
  const acceptedCount = acceptedRows[0]?.count ?? 0

  if (sentCount === 0) return null
  return acceptedCount / sentCount
}

/**
 * Average total value of approved/sent/accepted quotes.
 * Fetches quote totals from the DB and averages in JS to keep Drizzle queries simple.
 */
export async function getAverageQuoteValue(
  vendedorId?: string,
  dateRange?: DateRange
): Promise<number> {
  const baseConditions = buildConditions(vendedorId, dateRange)

  // Get all relevant quote IDs with their item sums
  const eligibleStatuses: Array<typeof quotes.status._.data> = ['approved', 'sent', 'accepted']

  const allRows = await Promise.all(
    eligibleStatuses.map((status) =>
      db
        .select({
          quoteId: quotes.id,
          total: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)`,
        })
        .from(quotes)
        .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
        .where(
          baseConditions.length > 0
            ? and(...baseConditions, eq(quotes.status, status))
            : eq(quotes.status, status)
        )
        .groupBy(quotes.id)
    )
  )

  const totals = allRows.flat().map((r) => Number(r.total))
  if (totals.length === 0) return 0
  return totals.reduce((sum, t) => sum + t, 0) / totals.length
}

/**
 * Count of quotes awaiting admin approval.
 */
export async function getPendingApprovalCount(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotes)
    .where(eq(quotes.status, 'pending_approval'))

  return rows[0]?.count ?? 0
}

/**
 * Count of quotes grouped by status.
 */
export async function getQuotesByStatus(
  vendedorId?: string
): Promise<Record<string, number>> {
  const conditions = vendedorId ? [eq(quotes.salespersonId, vendedorId)] : []

  const rows = await db
    .select({
      status: quotes.status,
      count: sql<number>`count(*)::int`,
    })
    .from(quotes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(quotes.status)

  const result: Record<string, number> = {}
  for (const row of rows) {
    result[row.status] = row.count
  }
  return result
}
