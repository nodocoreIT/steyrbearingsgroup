'use server'

import { db } from '@/db'
import { scoringConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface ScoringFactorInput {
  factor: 'volume' | 'frequency' | 'payment'
  weight: number
  enabled: boolean
}

/**
 * Validates and upserts scoring_config rows.
 * Enforces: sum of weights for ENABLED factors must equal 100.
 */
export async function updateScoringConfig(
  factors: ScoringFactorInput[]
): Promise<{ success: true } | { success: false; error: string }> {
  // Validate: enabled weights must sum to 100
  const enabledWeightSum = factors
    .filter((f) => f.enabled)
    .reduce((sum, f) => sum + f.weight, 0)

  if (enabledWeightSum !== 100) {
    return {
      success: false,
      error: `Los pesos de los factores habilitados deben sumar 100. Suma actual: ${enabledWeightSum}.`,
    }
  }

  // Upsert each factor row
  for (const factor of factors) {
    await db
      .insert(scoringConfig)
      .values({
        factor: factor.factor,
        weight: factor.weight,
        enabled: factor.enabled,
      })
      .onConflictDoUpdate({
        target: scoringConfig.factor,
        set: {
          weight: factor.weight,
          enabled: factor.enabled,
          updatedAt: new Date(),
        },
      })
  }

  return { success: true }
}

/**
 * Reads all scoring config rows (enabled and disabled).
 */
export async function getScoringConfig() {
  return db.select().from(scoringConfig).orderBy(scoringConfig.factor)
}

/**
 * Triggers score recalculation via internal cron endpoint.
 * Called server-side only — never exposes CRON_SECRET to the browser.
 */
export async function triggerRecalculate(): Promise<{ processed: number; errors: string[] }> {
  const cronSecret = process.env.CRON_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(`${appUrl}/api/cron/recalculate-scores`, {
    headers: { Authorization: `Bearer ${cronSecret ?? ''}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Recalculate failed: ${res.status}`)
  return res.json()
}

/**
 * Reads the most recent score_history entry to surface last recalculation date.
 */
export async function getLastRecalculationDate(): Promise<Date | null> {
  const { scoreHistory } = await import('@/db/schema')
  const { desc } = await import('drizzle-orm')

  const rows = await db
    .select({ calculatedAt: scoreHistory.calculatedAt })
    .from(scoreHistory)
    .orderBy(desc(scoreHistory.calculatedAt))
    .limit(1)

  return rows[0]?.calculatedAt ?? null
}
