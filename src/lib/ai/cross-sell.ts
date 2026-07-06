import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db'
import { quotes, quoteItems, products } from '@/db/schema'
import { eq, and, inArray, ne, desc, sql } from 'drizzle-orm'
import type { Product } from '@/db/schema/catalog'

let _anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

export interface ProductWithReason extends Product {
  reason: string
}

/**
 * Returns up to 3 cross-sell product suggestions for a given quote.
 * Fetches current quote items + client's last 5 accepted quote products,
 * then asks Claude to suggest complementary products.
 */
export async function getCrossSellSuggestions(
  quoteId: string
): Promise<ProductWithReason[]> {
  // Fetch current quote + client ID
  const [quoteRow] = await db
    .select({ clientId: quotes.clientId })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)

  if (!quoteRow) return []

  // Fetch current quote items
  const currentItems = await db
    .select({
      productId: quoteItems.productId,
      productName: products.name,
      categoryId: products.categoryId,
    })
    .from(quoteItems)
    .innerJoin(products, eq(products.id, quoteItems.productId))
    .where(eq(quoteItems.quoteId, quoteId))

  if (currentItems.length === 0) return []

  // Fetch client's last 5 accepted quotes' products
  const lastAcceptedQuotes = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(
      and(eq(quotes.clientId, quoteRow.clientId), eq(quotes.status, 'accepted'))
    )
    .orderBy(desc(quotes.createdAt))
    .limit(5)

  const pastProductIds: string[] = []
  if (lastAcceptedQuotes.length > 0) {
    const quoteIds = lastAcceptedQuotes.map((q) => q.id)
    const pastItems = await db
      .select({ productId: quoteItems.productId })
      .from(quoteItems)
      .where(inArray(quoteItems.quoteId, quoteIds))
    pastProductIds.push(...pastItems.map((i) => i.productId))
  }

  // Fetch top products in the same categories (excluding already-in-quote products)
  const categoryIds = [...new Set(currentItems.map((i) => i.categoryId).filter(Boolean))] as string[]
  const currentProductIds = currentItems.map((i) => i.productId)

  if (categoryIds.length === 0) return []

  const candidates = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      specs: products.specs,
      images: products.images,
      active: products.active,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(
      and(
        eq(products.active, true),
        inArray(products.categoryId, categoryIds),
        currentProductIds.length > 0
          ? sql`${products.id} NOT IN (${sql.join(currentProductIds.map((id) => sql`${id}::uuid`), sql`, `)})`
          : undefined
      )
    )
    .orderBy(desc(products.createdAt))
    .limit(20)

  if (candidates.length === 0) return []

  // Build Claude prompt
  const currentItemsText = currentItems
    .map((i) => `- ${i.productName}`)
    .join('\n')
  const pastProductNames =
    pastProductIds.length > 0
      ? '(client has previously purchased products in this category)'
      : '(no prior purchase history)'
  const candidateText = candidates
    .map((p, i) => `${i + 1}. ID:${p.id} | SKU:${p.sku} | ${p.name}`)
    .join('\n')

  const prompt = `You are a sales assistant for a bearings and industrial parts company. Based on the following current quote items and the available product catalog, suggest up to 3 complementary products the client might need.

Current quote items:
${currentItemsText}

Client purchase history: ${pastProductNames}

Available products in the same categories:
${candidateText}

Respond ONLY with a JSON array (max 3 items) in this format:
[{ "productId": "<ID from the list>", "reason": "<one sentence in Spanish explaining why>" }]

If no good suggestion exists, return an empty array [].`

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    // Extract JSON from the response (Claude may add commentary)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const suggestions = JSON.parse(jsonMatch[0]) as Array<{
      productId: string
      reason: string
    }>

    const result: ProductWithReason[] = []
    for (const s of suggestions.slice(0, 3)) {
      const product = candidates.find((c) => c.id === s.productId)
      if (product) {
        result.push({ ...product, reason: s.reason })
      }
    }
    return result
  } catch {
    return []
  }
}
