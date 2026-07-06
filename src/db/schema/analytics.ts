import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const searchTypeEnum = pgEnum('search_type', ['semantic', 'text', 'hybrid'])

export const searchQueries = pgTable('search_queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  query: text('query').notNull(),
  type: searchTypeEnum('type').notNull().default('text'),
  resultsCount: integer('results_count').notNull().default(0),
  clickedProductId: uuid('clicked_product_id'),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type SearchQuery = typeof searchQueries.$inferSelect
export type NewSearchQuery = typeof searchQueries.$inferInsert
