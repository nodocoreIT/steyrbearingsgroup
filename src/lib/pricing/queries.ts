import { db } from '@/db'
import { priceLists, priceListRules, clients, products, categories } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function getAllPriceLists() {
  const lists = await db.select().from(priceLists).orderBy(priceLists.createdAt)

  // Attach rule count per list
  const counts = await db
    .select({
      priceListId: priceListRules.priceListId,
      count: sql<number>`count(*)::int`,
    })
    .from(priceListRules)
    .groupBy(priceListRules.priceListId)

  const countMap = new Map(counts.map((c) => [c.priceListId, c.count]))

  return lists.map((list) => ({
    ...list,
    ruleCount: countMap.get(list.id) ?? 0,
  }))
}

export async function getPriceListById(id: string) {
  const rows = await db.select().from(priceLists).where(eq(priceLists.id, id)).limit(1)
  return rows[0] ?? null
}

export async function getPriceListRules(priceListId: string) {
  return db
    .select({
      id: priceListRules.id,
      priceListId: priceListRules.priceListId,
      productId: priceListRules.productId,
      categoryId: priceListRules.categoryId,
      marginPercent: priceListRules.marginPercent,
      createdAt: priceListRules.createdAt,
      productName: products.name,
      productSku: products.sku,
      categoryName: categories.name,
    })
    .from(priceListRules)
    .leftJoin(products, eq(products.id, priceListRules.productId))
    .leftJoin(categories, eq(categories.id, priceListRules.categoryId))
    .where(eq(priceListRules.priceListId, priceListId))
    .orderBy(priceListRules.createdAt)
}

export async function getPriceListClientsCount(priceListId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clients)
    .where(eq(clients.priceListId, priceListId))

  return rows[0]?.count ?? 0
}

export interface EffectivePriceResult {
  priceListId: string | null
  priceListName: string | null
  marginPercent: number
  // base cost is not stored in this schema — margin is the effective adjustment
}

/**
 * Finds the client's assigned price list, then looks for a matching rule.
 * Rule priority: product-level > category-level.
 * Returns margin % to apply on top of base cost.
 */
export async function getEffectiveMargin(
  productId: string,
  clientId: string
): Promise<EffectivePriceResult> {
  // 1. Find client's price list
  const clientRows = await db
    .select({ priceListId: clients.priceListId })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)

  const priceListId = clientRows[0]?.priceListId ?? null

  if (!priceListId) {
    return { priceListId: null, priceListName: null, marginPercent: 0 }
  }

  // 2. Find the price list name
  const listRows = await db
    .select({ name: priceLists.name })
    .from(priceLists)
    .where(eq(priceLists.id, priceListId))
    .limit(1)

  const priceListName = listRows[0]?.name ?? null

  // 3. Get product's category
  const productRows = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  const categoryId = productRows[0]?.categoryId ?? null

  // 4. Fetch all rules for this price list and match product > category
  const rules = await db
    .select()
    .from(priceListRules)
    .where(eq(priceListRules.priceListId, priceListId))

  const productRule = rules.find((r) => r.productId === productId)
  if (productRule) {
    return {
      priceListId,
      priceListName,
      marginPercent: Number(productRule.marginPercent),
    }
  }

  if (categoryId) {
    const categoryRule = rules.find((r) => r.categoryId === categoryId)
    if (categoryRule) {
      return {
        priceListId,
        priceListName,
        marginPercent: Number(categoryRule.marginPercent),
      }
    }
  }

  // No matching rule — margin 0
  return { priceListId, priceListName, marginPercent: 0 }
}
