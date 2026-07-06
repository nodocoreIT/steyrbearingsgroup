import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { clients } from './clients'
import { products } from './catalog'
import { profiles } from './auth'

export const quoteRequestStatusEnum = pgEnum('quote_request_status', [
  'pending',
  'in_progress',
  'quoted',
  'closed',
])

export const interestLists = pgTable('interest_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('My List'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const interestListItems = pgTable('interest_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  interestListId: uuid('interest_list_id')
    .notNull()
    .references(() => interestLists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
})

export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  interestListId: uuid('interest_list_id')
    .notNull()
    .references(() => interestLists.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  assignedTo: uuid('assigned_to').references(() => profiles.id),
  status: quoteRequestStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type InterestList = typeof interestLists.$inferSelect
export type InterestListItem = typeof interestListItems.$inferSelect
export type QuoteRequest = typeof quoteRequests.$inferSelect
