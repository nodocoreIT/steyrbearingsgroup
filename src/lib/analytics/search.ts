import { db } from '@/db'
import { searchQueries } from '@/db/schema'
import { sql } from 'drizzle-orm'

interface LogSearchQueryParams {
  query: string
  type: 'semantic' | 'text' | 'hybrid'
  resultsCount: number
  clickedProductId?: string
  userId?: string
}

export interface SearchAnalytics {
  topQueries: Array<{ query: string; count: number; type?: string }>
  noResultQueries: Array<{ query: string; count: number }>
  noResultCount: number
}

/**
 * Log a search query to the analytics table.
 * Designed to be called fire-and-forget (non-blocking).
 */
export async function logSearchQuery(params: LogSearchQueryParams): Promise<void> {
  try {
    await db.insert(searchQueries).values({
      query: params.query,
      type: params.type,
      resultsCount: params.resultsCount,
      clickedProductId: params.clickedProductId ?? null,
      userId: params.userId ?? null,
    })
  } catch {
    // Silently swallow — analytics must never break user-facing search
  }
}

/**
 * Returns the most searched queries sorted by frequency.
 */
export async function getTopSearchQueries(limit = 20): Promise<{ query: string; count: number }[]> {
  const rows = await db.execute(sql`
    SELECT query, count(*)::int as count
    FROM search_queries
    GROUP BY query
    ORDER BY count DESC
    LIMIT ${limit}
  `)
  return rows as unknown as { query: string; count: number }[]
}

/**
 * Returns queries that returned zero results, sorted by frequency.
 */
export async function getSearchesWithNoResults(
  limit = 20
): Promise<{ query: string; count: number }[]> {
  const rows = await db.execute(sql`
    SELECT query, count(*)::int as count
    FROM search_queries
    WHERE results_count = 0
    GROUP BY query
    ORDER BY count DESC
    LIMIT ${limit}
  `)
  return rows as unknown as { query: string; count: number }[]
}

/**
 * Combined search analytics: top queries + no-results queries, with optional date filter.
 * @param days Number of days to look back. If omitted, returns all-time data.
 */
export async function getSearchAnalytics(days?: number): Promise<SearchAnalytics> {
  const dateFilter = days
    ? sql`AND created_at >= now() - (${days} || ' days')::interval`
    : sql``

  const [topRows, noResultRows, noResultCountRows] = await Promise.all([
    db.execute(sql`
      SELECT query, type, count(*)::int as count
      FROM search_queries
      WHERE 1=1 ${dateFilter}
      GROUP BY query, type
      ORDER BY count DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT query, count(*)::int as count
      FROM search_queries
      WHERE results_count = 0 ${dateFilter}
      GROUP BY query
      ORDER BY count DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT count(*)::int as count
      FROM search_queries
      WHERE results_count = 0 ${dateFilter}
    `),
  ])

  return {
    topQueries: topRows as unknown as Array<{ query: string; count: number; type?: string }>,
    noResultQueries: noResultRows as unknown as Array<{ query: string; count: number }>,
    noResultCount:
      ((noResultCountRows as unknown as Array<{ count: number }>)[0]?.count) ?? 0,
  }
}
