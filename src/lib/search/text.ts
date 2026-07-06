import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { sql, eq, and } from 'drizzle-orm'
import type { Product } from '@/db/schema'

export interface TextSearchResult extends Omit<Product, 'specs' | 'images'> {
  specs: unknown
  images: string[] | null
  categoryName: string | null
}

/**
 * Full-text search using PostgreSQL's Spanish tsvector.
 * Falls back gracefully to ilike if the query is too short.
 */
export async function textSearch(
  query: string,
  limit = 20
): Promise<TextSearchResult[]> {
  if (!query?.trim()) return []

  const sanitized = query.trim().replace(/[!'()*]/g, '')

  try {
    const rows = await db.execute(sql`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.description,
        p.specs,
        p.images,
        p.active,
        p.category_id as "categoryId",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        c.name as "categoryName"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
        AND (
          to_tsvector('spanish', coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.sku, ''))
          @@ plainto_tsquery('spanish', ${sanitized})
          OR p.sku ILIKE ${'%' + sanitized + '%'}
          OR p.name ILIKE ${'%' + sanitized + '%'}
        )
      ORDER BY
        ts_rank(
          to_tsvector('spanish', coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.sku, '')),
          plainto_tsquery('spanish', ${sanitized})
        ) DESC
      LIMIT ${limit}
    `)

    return rows as unknown as TextSearchResult[]
  } catch {
    // If FTS fails (e.g. empty tsquery), fall back to ILIKE
    const fallback = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        specs: products.specs,
        images: products.images,
        active: products.active,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(
        and(
          eq(products.active, true),
          sql`(${products.name} ILIKE ${'%' + sanitized + '%'} OR ${products.sku} ILIKE ${'%' + sanitized + '%'})`
        )
      )
      .limit(limit)

    return fallback as TextSearchResult[]
  }
}
