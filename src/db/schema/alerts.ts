import {
  pgTable,
  uuid,
  timestamp,
  integer,
  text,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { clients } from './clients'

export const alertStatusEnum = pgEnum('alert_status', [
  'pending',
  'acknowledged',
  'resolved',
])

export const noPurchaseAlerts = pgTable('no_purchase_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  lastPurchaseAt: timestamp('last_purchase_at', { withTimezone: true }),
  daysSincePurchase: integer('days_since_purchase').notNull(),
  thresholdDays: integer('threshold_days').notNull().default(60),
  status: alertStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
})

export type NoPurchaseAlert = typeof noPurchaseAlerts.$inferSelect
export type AppConfig = typeof appConfig.$inferSelect
