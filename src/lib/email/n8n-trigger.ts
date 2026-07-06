/**
 * Triggers the n8n webhook to process the email send queue.
 * n8n should call GET /api/cron/process-email-queue with:
 *   Authorization: Bearer {CRON_SECRET}
 *
 * Set N8N_EMAIL_WEBHOOK_URL in env to enable. If not set, this is a no-op.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export function triggerEmailQueue(): void {
  const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL
  if (!webhookUrl) return

  fetch(webhookUrl, { method: 'POST' }).catch(() => {
    // Intentionally silent — n8n is optional infrastructure
  })
}
