import {
  pgTable,
  uuid,
  decimal,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'
import { clients } from './clients'

export const clientScores = pgTable('client_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .unique()
    .references(() => clients.id, { onDelete: 'cascade' }),
  score: decimal('score', { precision: 3, scale: 2 }).notNull().default('0'),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  scoringConfigSnapshot: jsonb('scoring_config_snapshot'),
})

export const scoreHistory = pgTable('score_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  score: decimal('score', { precision: 3, scale: 2 }).notNull(),
  snapshot: jsonb('snapshot'),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type ClientScore = typeof clientScores.$inferSelect
export type NewClientScore = typeof clientScores.$inferInsert
export type ScoreHistory = typeof scoreHistory.$inferSelect
