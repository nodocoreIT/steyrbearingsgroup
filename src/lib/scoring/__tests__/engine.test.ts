import { describe, it, expect } from 'vitest'
import { computeScore } from '../engine'
import type { ScoringConfig } from '@/db/schema/scoring_config'

// Helper to build a minimal ScoringConfig row
function makeConfig(
  factor: 'volume' | 'frequency' | 'payment',
  weight: number,
  enabled = true
): ScoringConfig {
  return {
    id: `test-${factor}`,
    factor,
    weight,
    enabled,
    updatedAt: new Date(),
  }
}

const defaultConfig: ScoringConfig[] = [
  makeConfig('volume', 40),
  makeConfig('frequency', 30),
  makeConfig('payment', 30),
]

describe('computeScore', () => {
  it('returns 0.0 when client has zero purchases', () => {
    const score = computeScore(
      { purchaseVolume: 0, purchaseFrequency: 0, acceptedQuotes: 0, sentQuotes: 0 },
      defaultConfig
    )
    expect(score).toBe(0.0)
  })

  it('returns 5.0 when all metrics are at maximum', () => {
    // MAX_VOLUME_ARS = 10_000_000, MAX_FREQUENCY = 24
    const score = computeScore(
      {
        purchaseVolume: 10_000_000,
        purchaseFrequency: 24,
        acceptedQuotes: 100,
        sentQuotes: 100,
      },
      defaultConfig
    )
    expect(score).toBe(5.0)
  })

  it('disabled factor contributes zero to the score', () => {
    // Disable volume; only frequency + payment (each weight 30) sum to 60
    const configNoVolume: ScoringConfig[] = [
      makeConfig('volume', 40, false),
      makeConfig('frequency', 30, true),
      makeConfig('payment', 30, true),
    ]
    // Perfect frequency and payment but zero volume
    const score = computeScore(
      {
        purchaseVolume: 0,
        purchaseFrequency: 24,
        acceptedQuotes: 100,
        sentQuotes: 100,
      },
      configNoVolume
    )
    // With volume disabled, weights normalize: frequency=50%, payment=50%
    // Both are 100 → weighted sum = 100 → score = 5.0
    expect(score).toBe(5.0)
  })

  it('weights are normalized when they do not sum to 100', () => {
    // Weights 20+20+20 = 60 — should normalize to 33.33% each
    const unevenConfig: ScoringConfig[] = [
      makeConfig('volume', 20),
      makeConfig('frequency', 20),
      makeConfig('payment', 20),
    ]
    const score = computeScore(
      {
        purchaseVolume: 10_000_000,
        purchaseFrequency: 24,
        acceptedQuotes: 100,
        sentQuotes: 100,
      },
      unevenConfig
    )
    // All factors at 100 → normalized weights still give 100 → score 5.0
    expect(score).toBe(5.0)
  })

  it('score is proportional when only one factor is present', () => {
    const volumeOnly: ScoringConfig[] = [
      makeConfig('volume', 100),
      makeConfig('frequency', 30, false),
      makeConfig('payment', 30, false),
    ]
    // Half of max volume → ~50 normalized → ~2.5 score
    const score = computeScore(
      { purchaseVolume: 5_000_000, purchaseFrequency: 0, acceptedQuotes: 0, sentQuotes: 0 },
      volumeOnly
    )
    expect(score).toBeGreaterThan(2.0)
    expect(score).toBeLessThanOrEqual(3.0)
  })

  it('score is clamped between 0.0 and 5.0', () => {
    const score = computeScore(
      {
        purchaseVolume: 100_000_000, // way above max
        purchaseFrequency: 999,
        acceptedQuotes: 999,
        sentQuotes: 999,
      },
      defaultConfig
    )
    expect(score).toBe(5.0)
  })
})
