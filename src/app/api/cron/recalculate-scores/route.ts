import { db } from '@/db'
import { clients } from '@/db/schema'
import { calculateAndSaveScore } from '@/lib/scoring/engine'
import { NextRequest } from 'next/server'

/**
 * GET /api/cron/recalculate-scores
 * Protected by Bearer token (CRON_SECRET env var).
 * Recalculates scores for all clients and returns a summary.
 */
export async function GET(req: NextRequest) {
  // Auth guard
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all client IDs
  const allClients = await db.select({ id: clients.id }).from(clients)

  let processed = 0
  const errors: string[] = []

  for (const client of allClients) {
    try {
      await calculateAndSaveScore(client.id)
      processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${client.id}: ${msg}`)
    }
  }

  return Response.json({ processed, errors })
}
