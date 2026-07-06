import { db } from '@/db'
import { noPurchaseAlerts, quotes, clients } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { notify } from '@/lib/notifications'

/**
 * Returns the date of the last accepted quote for a given client,
 * or null if the client has never had an accepted quote.
 */
export async function getLastPurchaseDate(clientId: string): Promise<Date | null> {
  const rows = await db
    .select({ createdAt: quotes.createdAt })
    .from(quotes)
    .where(and(eq(quotes.clientId, clientId), eq(quotes.status, 'accepted')))
    .orderBy(desc(quotes.createdAt))
    .limit(1)

  return rows[0]?.createdAt ?? null
}

/**
 * Creates a no-purchase alert for the given client.
 * Does not create a duplicate if a pending alert already exists for this client.
 */
export async function createNoPurchaseAlert(
  clientId: string,
  lastPurchaseDate: Date | null,
  thresholdDays: number
): Promise<void> {
  const daysSince = lastPurchaseDate
    ? Math.floor((Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : thresholdDays + 1 // treat "never purchased" as exceeding threshold

  await db.insert(noPurchaseAlerts).values({
    clientId,
    lastPurchaseAt: lastPurchaseDate ?? undefined,
    daysSincePurchase: daysSince,
    thresholdDays,
    status: 'pending',
  })

  // In-app notification to admin — fire-and-forget
  notify('no_purchase_alert', { clientId, daysSincePurchase: daysSince }).catch(() => {})
}

/**
 * Marks an alert as acknowledged.
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await db
    .update(noPurchaseAlerts)
    .set({ status: 'acknowledged' })
    .where(eq(noPurchaseAlerts.id, alertId))
}

/**
 * Marks an alert as resolved.
 */
export async function resolveAlert(alertId: string): Promise<void> {
  await db
    .update(noPurchaseAlerts)
    .set({ status: 'resolved' })
    .where(eq(noPurchaseAlerts.id, alertId))
}

/**
 * Returns all pending no-purchase alerts with client data.
 */
export async function getPendingAlerts() {
  return db
    .select({
      id: noPurchaseAlerts.id,
      clientId: noPurchaseAlerts.clientId,
      lastPurchaseAt: noPurchaseAlerts.lastPurchaseAt,
      daysSincePurchase: noPurchaseAlerts.daysSincePurchase,
      thresholdDays: noPurchaseAlerts.thresholdDays,
      status: noPurchaseAlerts.status,
      createdAt: noPurchaseAlerts.createdAt,
      clientName: clients.razonSocial,
    })
    .from(noPurchaseAlerts)
    .innerJoin(clients, eq(clients.id, noPurchaseAlerts.clientId))
    .where(eq(noPurchaseAlerts.status, 'pending'))
    .orderBy(desc(noPurchaseAlerts.createdAt))
}

/**
 * Returns all alerts (all statuses) with client data.
 */
export async function getAllAlerts() {
  return db
    .select({
      id: noPurchaseAlerts.id,
      clientId: noPurchaseAlerts.clientId,
      lastPurchaseAt: noPurchaseAlerts.lastPurchaseAt,
      daysSincePurchase: noPurchaseAlerts.daysSincePurchase,
      thresholdDays: noPurchaseAlerts.thresholdDays,
      status: noPurchaseAlerts.status,
      createdAt: noPurchaseAlerts.createdAt,
      clientName: clients.razonSocial,
    })
    .from(noPurchaseAlerts)
    .innerJoin(clients, eq(clients.id, noPurchaseAlerts.clientId))
    .orderBy(desc(noPurchaseAlerts.createdAt))
}

/**
 * Checks if a pending alert already exists for a client today.
 * Used for idempotency in the cron job.
 */
export async function hasPendingAlertForClient(clientId: string): Promise<boolean> {
  const rows = await db
    .select({ id: noPurchaseAlerts.id })
    .from(noPurchaseAlerts)
    .where(
      and(
        eq(noPurchaseAlerts.clientId, clientId),
        eq(noPurchaseAlerts.status, 'pending')
      )
    )
    .limit(1)

  return rows.length > 0
}
