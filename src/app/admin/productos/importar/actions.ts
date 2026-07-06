'use server'

import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface CSVRow {
  name: string
  sku: string
  categorySlug: string
  description: string
  active: boolean
}

async function triggerEmbedding(productId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/embeddings/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': process.env.INTERNAL_API_SECRET ?? '',
    },
    body: JSON.stringify({ productId }),
  }).catch(() => {})
}

export async function importProductsFromCSV(
  formData: FormData
): Promise<{ imported: number; errors: string[] }> {
  let rows: CSVRow[] = []
  try {
    rows = JSON.parse(formData.get('rows') as string) as CSVRow[]
  } catch {
    return { imported: 0, errors: ['Invalid rows data'] }
  }

  let imported = 0
  const errors: string[] = []

  // Resolve category slugs upfront
  const slugMap = new Map<string, string>()
  const uniqueSlugs = [...new Set(rows.map((r) => r.categorySlug).filter(Boolean))]
  for (const slug of uniqueSlugs) {
    const catRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)
    if (catRows[0]) slugMap.set(slug, catRows[0].id)
  }

  for (const row of rows) {
    try {
      const [inserted] = await db
        .insert(products)
        .values({
          name: row.name,
          sku: row.sku,
          description: row.description || null,
          categoryId: row.categorySlug ? (slugMap.get(row.categorySlug) ?? null) : null,
          active: row.active,
        })
        .onConflictDoNothing()
        .returning({ id: products.id })

      if (inserted) {
        triggerEmbedding(inserted.id)
        imported++
      }
    } catch (err) {
      errors.push(`SKU ${row.sku}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }

  return { imported, errors }
}
