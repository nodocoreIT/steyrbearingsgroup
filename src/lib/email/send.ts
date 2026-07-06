import { resend } from './client'
import { renderQuoteApprovedEmail } from './templates/quote-approved'
import { renderQuoteSentEmail } from './templates/quote-sent'
import { renderNewQuoteRequestEmail } from './templates/new-quote-request'
import { renderCampaignEmail } from './templates/campaign'
import { db } from '@/db'
import { quotes, quoteItems, clients, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Seekingbusiness <noreply@seekingbusiness.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClientEmail(clientId: string): Promise<string | null> {
  const rows = await db
    .select({ profileId: clients.profileId })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)

  if (!rows[0]) return null

  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.getUserById(rows[0].profileId)
  return data.user?.email ?? null
}

async function getSalespersonEmail(salespersonId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.getUserById(salespersonId)
  return data.user?.email ?? null
}

async function getSalespersonName(salespersonId: string): Promise<string> {
  const rows = await db
    .select({ fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, salespersonId))
    .limit(1)
  return rows[0]?.fullName ?? 'Salesperson'
}

async function getQuoteData(quoteId: string) {
  const quoteRows = await db
    .select({
      id: quotes.id,
      clientId: quotes.clientId,
      salespersonId: quotes.salespersonId,
    })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)

  if (!quoteRows[0]) return null

  const clientRows = await db
    .select({ razonSocial: clients.razonSocial, profileId: clients.profileId })
    .from(clients)
    .where(eq(clients.id, quoteRows[0].clientId))
    .limit(1)

  const items = await db
    .select({ quantity: quoteItems.quantity })
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId))

  const itemsSummary =
    items.length > 0
      ? items.map((item, i) => `Item ${i + 1}: qty ${item.quantity}`).join('\n')
      : 'No items listed.'

  return {
    quote: quoteRows[0],
    clientName: clientRows[0]?.razonSocial ?? 'Client',
    itemsSummary,
  }
}

// ─── Exported send functions ──────────────────────────────────────────────────

/**
 * Sends quote-approved notification to the client.
 * Non-blocking — callers should attach .catch(() => {}).
 */
export async function sendQuoteApprovedEmail(
  clientEmail: string,
  quoteId: string
): Promise<void> {
  const data = await getQuoteData(quoteId)
  if (!data) return

  const html = renderQuoteApprovedEmail({
    quoteNumber: 0,
    clientName: data.clientName,
    itemsSummary: data.itemsSummary,
    viewQuoteUrl: `${APP_URL}/mis-presupuestos/${quoteId}`,
  })

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: clientEmail,
    subject: `Your quote has been approved — Seekingbusiness`,
    html,
  })
}

/**
 * Sends quote-sent notification to the client.
 * Non-blocking — callers should attach .catch(() => {}).
 */
export async function sendQuoteSentEmail(
  clientEmail: string,
  quoteId: string,
  pdfUrl?: string
): Promise<void> {
  const data = await getQuoteData(quoteId)
  if (!data) return

  const html = renderQuoteSentEmail({
    quoteNumber: 0,
    clientName: data.clientName,
    itemsSummary: data.itemsSummary,
    viewQuoteUrl: `${APP_URL}/mis-presupuestos/${quoteId}`,
    pdfUrl,
  })

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: clientEmail,
    subject: `Your quote is ready — Seekingbusiness`,
    html,
  })
}

/**
 * Sends new-quote-request notification to a salesperson.
 * Non-blocking — callers should attach .catch(() => {}).
 */
export async function sendNewQuoteRequestEmail(
  vendedorEmail: string,
  clientName: string,
  productCount: number
): Promise<void> {
  const html = renderNewQuoteRequestEmail({
    vendedorName: 'Team',
    clientName,
    productCount,
    reviewUrl: `${APP_URL}/admin/presupuestos`,
  })

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: vendedorEmail,
    subject: `New quote request from ${clientName} — Seekingbusiness`,
    html,
  })
}

/**
 * Sends a campaign email using the generic campaign template.
 * Used by the email queue worker — never called directly for bulk sends.
 */
export async function sendCampaignEmail(
  to: string,
  subject: string,
  content: string
): Promise<void> {
  const html = renderCampaignEmail({ subject, htmlContent: content })

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })
}

// ─── Internal helpers (exported for use in quotes/interest-lists actions) ────

export { getClientEmail, getSalespersonEmail, getSalespersonName }
