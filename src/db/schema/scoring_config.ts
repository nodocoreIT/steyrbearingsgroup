import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const scoringFactorEnum = pgEnum('scoring_factor', [
  'volume',
  'frequency',
  'payment',
])

export const scoringConfig = pgTable('scoring_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  factor: scoringFactorEnum('factor').notNull().unique(),
  weight: integer('weight').notNull(), // 0–100, should sum to 100 across enabled rows
  enabled: boolean('enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type ScoringConfig = typeof scoringConfig.$inferSelect
export type NewScoringConfig = typeof scoringConfig.$inferInsert

// Default seed values
export const defaultScoringConfig: NewScoringConfig[] = [
  { factor: 'volume', weight: 40, enabled: true },
  { factor: 'frequency', weight: 30, enabled: true },
  { factor: 'payment', weight: 30, enabled: true },
]
