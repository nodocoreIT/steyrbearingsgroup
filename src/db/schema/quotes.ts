import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { clients } from './clients'
import { profiles } from './auth'
import { products } from './catalog'

export const quoteStatusEnum = pgEnum('quote_status', [
  'requested',
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'sent',
  'accepted',
  'declined',
])

export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const priceListRules = pgTable('price_list_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  priceListId: uuid('price_list_id')
    .notNull()
    .references(() => priceLists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  categoryId: uuid('category_id'),
  marginPercent: decimal('margin_percent', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  salespersonId: uuid('salesperson_id')
    .notNull()
    .references(() => profiles.id),
  status: quoteStatusEnum('status').notNull().default('draft'),
  notes: text('notes'),
  approvedBy: uuid('approved_by').references(() => profiles.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  marginPercent: decimal('margin_percent', { precision: 5, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
})

export const quoteApprovalLog = pgTable('quote_approval_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // submitted | approved | rejected
  performedBy: uuid('performed_by')
    .notNull()
    .references(() => profiles.id),
  performedAt: timestamp('performed_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
})

export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
export type QuoteItem = typeof quoteItems.$inferSelect
export type PriceList = typeof priceLists.$inferSelect
