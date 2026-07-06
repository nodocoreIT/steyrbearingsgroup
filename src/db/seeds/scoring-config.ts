import { db } from '../index'
import { scoringConfig } from '../schema/scoring_config'

/**
 * Seeds default scoring configuration.
 * Weights: volume 40%, frequency 30%, payment 30%
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */
async function seedScoringConfig() {
  console.log('Seeding scoring_config...')

  await db
    .insert(scoringConfig)
    .values([
      { factor: 'volume', weight: 40, enabled: true },
      { factor: 'frequency', weight: 30, enabled: true },
      { factor: 'payment', weight: 30, enabled: true },
    ])
    .onConflictDoNothing()

  console.log('scoring_config seeded: volume(40), frequency(30), payment(30)')
}

seedScoringConfig().catch(console.error)
