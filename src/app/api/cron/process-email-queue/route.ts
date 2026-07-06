import { db } from '@/db'
import { sendQueue, campaignRecipients } from '@/db/schema'
import { sendCampaignEmail } from '@/lib/email/send'
import { eq, and, lte, lt } from 'drizzle-orm'
import { NextRequest } from 'next/server'

const BATCH_SIZE = 50
const MAX_ATTEMPTS = 3

/**
 * GET /api/cron/process-email-queue
 * Processes pending email send_queue rows in batches of 50.
 * Protected by Authorization: Bearer {CRON_SECRET}.
 * Scheduled every 5 minutes via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Fetch up to BATCH_SIZE pending email rows that are due and below max attempts
    const pending = await db
      .select()
      .from(sendQueue)
      .where(
        and(
          eq(sendQueue.type, 'email'),
          eq(sendQueue.status, 'pending'),
          lte(sendQueue.scheduledAt, now),
          lt(sendQueue.attempts, MAX_ATTEMPTS)
        )
      )
      .limit(BATCH_SIZE)

    let sent = 0
    let failed = 0

    for (const item of pending) {
      const payload = item.payload as Record<string, unknown> | null
      const subject = (payload?.subject as string) ?? '(no subject)'
      const htmlContent = (payload?.htmlContent as string) ?? ''
      const campaignRecipientId = payload?.campaignRecipientId as string | undefined

      try {
        // Mark as processing to prevent double-send by concurrent cron runs
        await db
          .update(sendQueue)
          .set({ status: 'processing' })
          .where(eq(sendQueue.id, item.id))

        await sendCampaignEmail(item.recipient, subject, htmlContent)

        await db
          .update(sendQueue)
          .set({
            status: 'sent',
            sentAt: new Date(),
          })
          .where(eq(sendQueue.id, item.id))

        // Update campaign_recipient status if this item is linked to one
        if (campaignRecipientId) {
          await db
            .update(campaignRecipients)
            .set({ status: 'sent', sentAt: new Date() })
            .where(eq(campaignRecipients.id, campaignRecipientId))
        }

        sent++
      } catch (err) {
        const newAttempts = item.attempts + 1
        const isFinal = newAttempts >= MAX_ATTEMPTS

        await db
          .update(sendQueue)
          .set({
            status: isFinal ? 'failed' : 'pending',
            attempts: newAttempts,
            lastError: err instanceof Error ? err.message : String(err),
          })
          .where(eq(sendQueue.id, item.id))

        // Mark campaign_recipient as failed if max attempts reached
        if (isFinal && campaignRecipientId) {
          await db
            .update(campaignRecipients)
            .set({
              status: 'failed',
              error: err instanceof Error ? err.message : String(err),
            })
            .where(eq(campaignRecipients.id, campaignRecipientId))
        }

        failed++
      }
    }

    return Response.json({ sent, failed, processed: pending.length })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
