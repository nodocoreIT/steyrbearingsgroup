import { db } from '@/db'
import { interestLists, interestListItems, products, clients, profiles } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function getVendedores() {
  return db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(inArray(profiles.role, ['vendedor', 'admin_general', 'admin_secundario']))
}

/**
 * Get the active interest list for a client, or create one if none exists.
 * `clientId` is the `clients.id` (not the auth user id).
 */
export async function getOrCreateInterestList(clientId: string) {
  const existing = await db
    .select()
    .from(interestLists)
    .where(eq(interestLists.clientId, clientId))
    .limit(1)

  if (existing[0]) return existing[0]

  const [created] = await db
    .insert(interestLists)
    .values({ clientId, name: 'My List' })
    .returning()

  return created
}

export async function getInterestListWithItems(clientId: string) {
  const list = await db
    .select()
    .from(interestLists)
    .where(eq(interestLists.clientId, clientId))
    .limit(1)

  if (!list[0]) return null

  const items = await db
    .select({
      id: interestListItems.id,
      productId: interestListItems.productId,
      quantity: interestListItems.quantity,
      notes: interestListItems.notes,
      addedAt: interestListItems.addedAt,
      productName: products.name,
      productSku: products.sku,
      productImages: products.images,
    })
    .from(interestListItems)
    .innerJoin(products, eq(products.id, interestListItems.productId))
    .where(eq(interestListItems.interestListId, list[0].id))

  return { list: list[0], items }
}

export async function getCartItemCount(clientId: string): Promise<number> {
  const list = await db
    .select({ id: interestLists.id })
    .from(interestLists)
    .where(eq(interestLists.clientId, clientId))
    .limit(1)

  if (!list[0]) return 0

  const items = await db
    .select({ id: interestListItems.id })
    .from(interestListItems)
    .where(eq(interestListItems.interestListId, list[0].id))

  return items.length
}

export async function getClientIdByProfileId(profileId: string): Promise<string | null> {
  const rows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.profileId, profileId))
    .limit(1)

  return rows[0]?.id ?? null
}
