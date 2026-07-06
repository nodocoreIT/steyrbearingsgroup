import { db } from '@/db'
import { clients, appConfig } from '@/db/schema'
import {
  getLastPurchaseDate,
  createNoPurchaseAlert,
  hasPendingAlertForClient,
} from '@/lib/alerts/no-purchase'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'

const DEFAULT_THRESHOLD_DAYS = 60

/**
 * GET /api/cron/no-purchase-check
 * Protected by Bearer token (CRON_SECRET env var).
 * Finds clients whose last purchase exceeds the configured threshold
 * and creates a no_purchase_alerts row (idempotent — skips existing pending alerts).
 */
export async function GET(req: NextRequest) {
  // Auth guard
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Read threshold from app_config
  const [configRow] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, 'no_purchase_threshold_days'))
    .limit(1)

  const thresholdDays: number =
    typeof configRow?.value === 'number'
      ? configRow.value
      : DEFAULT_THRESHOLD_DAYS

  // Fetch all clients
  const allClients = await db.select({ id: clients.id }).from(clients)

  let flagged = 0

  for (const client of allClients) {
    try {
      // Skip if there's already a pending alert for this client
      const hasPending = await hasPendingAlertForClient(client.id)
      if (hasPending) continue

      const lastPurchase = await getLastPurchaseDate(client.id)

      // Determine days since last purchase
      let daysSince: number
      if (!lastPurchase) {
        // Never purchased — treat as exceeding threshold
        daysSince = thresholdDays + 1
      } else {
        daysSince = Math.floor(
          (Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      if (daysSince >= thresholdDays) {
        await createNoPurchaseAlert(client.id, lastPurchase, thresholdDays)
        flagged++
      }
    } catch {
      // Log and continue — one bad client shouldn't stop the whole batch
      console.error(`[no-purchase-check] Failed for client ${client.id}`)
    }
  }

  return Response.json({ flagged })
}
