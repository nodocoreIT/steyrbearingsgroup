import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { profiles } from './auth'
// Forward reference: priceLists is defined in quotes.ts — imported lazily to avoid circular deps
// The priceListId column references price_lists(id) at the DB level

export const afipStatusEnum = pgEnum('afip_status', [
  'validated',
  'pending',
  'invalid',
])

export const bcraStatusEnum = pgEnum('bcra_status', [
  'clear',
  'risk',
  'pending',
  'unavailable',
])

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  cuit: text('cuit').notNull().unique(),
  razonSocial: text('razon_social'),
  afipStatus: afipStatusEnum('afip_status').default('pending').notNull(),
  afipCachedAt: timestamp('afip_cached_at', { withTimezone: true }),
  bcraStatus: bcraStatusEnum('bcra_status').default('pending').notNull(),
  bcraCachedAt: timestamp('bcra_cached_at', { withTimezone: true }),
  bcraRiskLevel: text('bcra_risk_level'),
  industry: text('industry'),
  validationPending: boolean('validation_pending').default(false).notNull(),
  clientConfig: jsonb('client_config').$type<Record<string, unknown>>(),
  // Assigned price list — FK to price_lists(id); nullable means "no special pricing"
  priceListId: uuid('price_list_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
