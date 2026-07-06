import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db'
import { quotes, quoteItems, products, categories } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

let _anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

export interface ForecastResult {
  category: string
  trend: 'up' | 'down' | 'stable'
  confidence: number
  reasoning: string
}

/**
 * Aggregates the last 24 months of accepted quotes by category + month
 * and asks Claude to generate demand trend forecasts.
 */
export async function getDemandForecast(): Promise<ForecastResult[]> {
  const twentyFourMonthsAgo = new Date()
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24)

  // Aggregate accepted quote value by category per month
  const rows = await db
    .select({
      categoryName: categories.name,
      month: sql<string>`to_char(${quotes.createdAt}, 'YYYY-MM')`,
      totalValue: sql<string>`sum(${quoteItems.subtotal})`,
      orderCount: sql<number>`count(distinct ${quotes.id})::int`,
    })
    .from(quotes)
    .innerJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
    .innerJoin(products, eq(products.id, quoteItems.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(eq(quotes.status, 'accepted'), gte(quotes.createdAt, twentyFourMonthsAgo))
    )
    .groupBy(categories.name, sql`to_char(${quotes.createdAt}, 'YYYY-MM')`)
    .orderBy(categories.name, sql`to_char(${quotes.createdAt}, 'YYYY-MM')`)

  if (rows.length === 0) {
    return []
  }

  // Summarize data for Claude
  const summary = rows
    .map(
      (r) =>
        `${r.categoryName} | ${r.month} | $${Number(r.totalValue).toFixed(0)} | ${r.orderCount} orders`
    )
    .join('\n')

  const prompt = `You are a demand forecasting analyst for an industrial bearings and parts company. Based on the following monthly sales data by category (last 24 months), identify trends and forecast the next 3-6 months.

Data format: Category | Month | Total Value (ARS) | Order Count
${summary}

Respond ONLY with a JSON array in this exact format:
[{ "category": "<category name>", "trend": "up" | "down" | "stable", "confidence": <0.0-1.0>, "reasoning": "<one sentence in Spanish>" }]

Include all categories present in the data. If data is insufficient for a category, set confidence to 0.3 and trend to "stable".`

  try {
    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0]) as ForecastResult[]
    return parsed.filter(
      (r) =>
        typeof r.category === 'string' &&
        ['up', 'down', 'stable'].includes(r.trend) &&
        typeof r.confidence === 'number' &&
        typeof r.reasoning === 'string'
    )
  } catch {
    return []
  }
}
