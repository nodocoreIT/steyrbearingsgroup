import { db } from '@/db'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { textSearch } from './text'
import { sql } from 'drizzle-orm'

export interface SemanticSearchResult {
  id: string
  sku: string
  name: string
  description: string | null
  specs: unknown
  images: string[] | null
  active: boolean
  categoryId: string | null
  createdAt: Date
  updatedAt: Date
  categoryName: string | null
  similarity: number
}

/**
 * Semantic search using pgvector cosine similarity.
 * Falls back to text search if embeddings are unavailable.
 */
export async function semanticSearch(
  query: string,
  limit = 20
): Promise<SemanticSearchResult[]> {
  if (!query?.trim()) return []

  try {
    const embedding = await generateEmbedding(query)
    const vectorLiteral = `[${embedding.join(',')}]`

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
        c.name as "categoryName",
        1 - (pe.embedding <=> ${vectorLiteral}::vector) as similarity
      FROM products p
      JOIN product_embeddings pe ON pe.product_id = p.id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      ORDER BY similarity DESC
      LIMIT ${limit}
    `)

    return rows as unknown as SemanticSearchResult[]
  } catch {
    // pgvector not available or embedding failed — fall back to text search
    const fallback = await textSearch(query, limit)
    return fallback.map((r) => ({ ...r, similarity: 0 }))
  }
}
