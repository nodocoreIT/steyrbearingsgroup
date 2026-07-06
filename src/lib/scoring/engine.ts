import { db } from '@/db'
import {
  scoringConfig,
  clientScores,
  scoreHistory,
  quotes,
  quoteItems,
} from '@/db/schema'
import type { ScoringConfig } from '@/db/schema/scoring_config'
import { eq, and, gte, sql } from 'drizzle-orm'
import { normalizeVolume, normalizeFrequency, normalizePayment } from './normalize'

// Business constants — max reference values for normalization
const MAX_VOLUME_ARS = 10_000_000   // 10M ARS annual volume = 100 points
const MAX_FREQUENCY = 24            // 24 orders/year = 100 points

export interface ScoringInput {
  /** Total value of accepted quotes in the last 12 months (ARS) */
  purchaseVolume: number
  /** Count of accepted quotes in the last 12 months */
  purchaseFrequency: number
  /** Count of accepted quotes */
  acceptedQuotes: number
  /** Count of sent quotes (accepted + sent + declined) */
  sentQuotes: number
}

/**
 * Normalizes weights so that enabled factors sum to 100.
 * Disabled factors are excluded; their weight is redistributed proportionally.
 */
function normalizeWeights(config: ScoringConfig[]): Map<string, number> {
  const enabled = config.filter((c) => c.enabled)
  const total = enabled.reduce((sum, c) => sum + c.weight, 0)

  const normalized = new Map<string, number>()
  for (const row of enabled) {
    normalized.set(row.factor, total > 0 ? (row.weight / total) * 100 : 0)
  }
  return normalized
}

/**
 * Pure scoring function. Takes raw input metrics and active config rows.
 * Returns a score in the 0.0–5.0 range.
 */
export function computeScore(input: ScoringInput, config: ScoringConfig[]): number {
  const weights = normalizeWeights(config)

  const volumeNorm = normalizeVolume(input.purchaseVolume, MAX_VOLUME_ARS)
  const frequencyNorm = normalizeFrequency(input.purchaseFrequency, MAX_FREQUENCY)
  const paymentNorm = normalizePayment(input.acceptedQuotes, input.sentQuotes)

  const factorScores: Record<string, number> = {
    volume: volumeNorm,
    frequency: frequencyNorm,
    payment: paymentNorm,
  }

  let weightedSum = 0
  for (const [factor, weight] of weights.entries()) {
    weightedSum += (factorScores[factor] ?? 0) * (weight / 100)
  }

  // weightedSum is in 0–100; scale to 0.0–5.0
  const raw = (weightedSum / 100) * 5
  // Round to 1 decimal, clamp
  return Math.min(5.0, Math.max(0.0, Math.round(raw * 10) / 10))
}

/**
 * Reads scoring config, computes a score for the given client,
 * upserts client_scores and appends a score_history row.
 * Returns the computed score (0.0–5.0).
 */
export async function calculateAndSaveScore(clientId: string): Promise<number> {
  // 1. Read active scoring config
  const config = await db
    .select()
    .from(scoringConfig)
    .where(eq(scoringConfig.enabled, true))

  // 2. Query last 12 months accepted quotes for client
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const [quoteStats] = await db
    .select({
      purchaseVolume: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)`,
      purchaseFrequency: sql<number>`count(distinct ${quotes.id})::int`,
    })
    .from(quotes)
    .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
    .where(
      and(
        eq(quotes.clientId, clientId),
        eq(quotes.status, 'accepted'),
        gte(quotes.createdAt, twelveMonthsAgo)
      )
    )

  // 3. Count sent quotes (accepted + sent + declined) for payment behavior
  const sentStatuses: Array<typeof quotes.status._.data> = ['accepted', 'sent', 'declined']
  const sentCounts = await Promise.all(
    sentStatuses.map((status) =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quotes)
        .where(and(eq(quotes.clientId, clientId), eq(quotes.status, status)))
    )
  )
  const sentQuotes = sentCounts.reduce((sum, rows) => sum + (rows[0]?.count ?? 0), 0)

  const [acceptedRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotes)
    .where(and(eq(quotes.clientId, clientId), eq(quotes.status, 'accepted')))

  const input: ScoringInput = {
    purchaseVolume: Number(quoteStats?.purchaseVolume ?? 0),
    purchaseFrequency: quoteStats?.purchaseFrequency ?? 0,
    acceptedQuotes: acceptedRows?.count ?? 0,
    sentQuotes,
  }

  // 4. Compute score
  const score = computeScore(input, config)

  // 5. Build config snapshot
  const configSnapshot = {
    factors: config.map((c) => ({ factor: c.factor, weight: c.weight, enabled: c.enabled })),
    input,
    calculatedAt: new Date().toISOString(),
  }

  // 6. Upsert client_scores
  await db
    .insert(clientScores)
    .values({
      clientId,
      score: score.toFixed(2),
      scoringConfigSnapshot: configSnapshot,
    })
    .onConflictDoUpdate({
      target: clientScores.clientId,
      set: {
        score: score.toFixed(2),
        calculatedAt: new Date(),
        scoringConfigSnapshot: configSnapshot,
      },
    })

  // 7. Append score_history
  await db.insert(scoreHistory).values({
    clientId,
    score: score.toFixed(2),
    snapshot: configSnapshot,
  })

  return score
}
