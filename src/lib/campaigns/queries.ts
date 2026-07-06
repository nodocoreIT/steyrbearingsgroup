import { db } from '@/db'
import { campaigns, campaignRecipients, clients } from '@/db/schema'
import { eq, and, gte, count, desc } from 'drizzle-orm'

// ─── Campaign list ────────────────────────────────────────────────────────────

export async function getAllCampaigns() {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      type: campaigns.type,
      status: campaigns.status,
      createdAt: campaigns.createdAt,
      sentAt: campaigns.sentAt,
    })
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt))

  // Fetch recipient counts for each campaign
  const result = await Promise.all(
    rows.map(async (campaign) => {
      const [recipientCount] = await db
        .select({ count: count() })
        .from(campaignRecipients)
        .where(eq(campaignRecipients.campaignId, campaign.id))

      return {
        ...campaign,
        recipientCount: recipientCount?.count ?? 0,
      }
    })
  )

  return result
}

// ─── Campaign detail ──────────────────────────────────────────────────────────

export async function getCampaignById(id: string) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1)

  if (!campaign) return null

  const recipients = await db
    .select({
      id: campaignRecipients.id,
      clientId: campaignRecipients.clientId,
      status: campaignRecipients.status,
      sentAt: campaignRecipients.sentAt,
      error: campaignRecipients.error,
      razonSocial: clients.razonSocial,
    })
    .from(campaignRecipients)
    .leftJoin(clients, eq(clients.id, campaignRecipients.clientId))
    .where(eq(campaignRecipients.campaignId, id))

  return { campaign, recipients }
}

// ─── Campaign stats ───────────────────────────────────────────────────────────

export async function getCampaignStats(campaignId: string) {
  const [total] = await db
    .select({ count: count() })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId))

  const [sent] = await db
    .select({ count: count() })
    .from(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, 'sent')
      )
    )

  const [failed] = await db
    .select({ count: count() })
    .from(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, 'failed')
      )
    )

  return {
    total: total?.count ?? 0,
    sent: sent?.count ?? 0,
    failed: failed?.count ?? 0,
    pending: (total?.count ?? 0) - (sent?.count ?? 0) - (failed?.count ?? 0),
  }
}

// ─── Segment resolver ─────────────────────────────────────────────────────────

export type SegmentFilter =
  | { type: 'all' }
  | { type: 'bcra_risk'; riskLevel: string }
  | { type: 'min_score'; minScore: number }
  | { type: 'by_industry'; industry: string }

export async function resolveSegment(filter: SegmentFilter) {
  if (filter.type === 'all') {
    const rows = await db
      .select({
        clientId: clients.id,
        profileId: clients.profileId,
        razonSocial: clients.razonSocial,
      })
      .from(clients)

    return rows
  }

  if (filter.type === 'bcra_risk') {
    const rows = await db
      .select({
        clientId: clients.id,
        profileId: clients.profileId,
        razonSocial: clients.razonSocial,
      })
      .from(clients)
      .where(eq(clients.bcraRiskLevel, filter.riskLevel))

    return rows
  }

  if (filter.type === 'by_industry') {
    const rows = await db
      .select({
        clientId: clients.id,
        profileId: clients.profileId,
        razonSocial: clients.razonSocial,
      })
      .from(clients)
      .where(eq(clients.industry, filter.industry))

    return rows
  }

  if (filter.type === 'min_score') {
    const { clientScores } = await import('@/db/schema')

    const rows = await db
      .select({
        clientId: clients.id,
        profileId: clients.profileId,
        razonSocial: clients.razonSocial,
      })
      .from(clients)
      .innerJoin(clientScores, eq(clientScores.clientId, clients.id))
      .where(gte(clientScores.score, String(filter.minScore)))

    return rows
  }

  return []
}
