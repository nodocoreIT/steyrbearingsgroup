import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { profiles } from './auth'
import { clients } from './clients'

export const campaignTypeEnum = pgEnum('campaign_type', [
  'email',
  'whatsapp_future',
])

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'running',
  'paused',
  'completed',
  'cancelled',
])

export const recipientStatusEnum = pgEnum('recipient_status', [
  'pending',
  'sent',
  'failed',
])

export const sendQueueStatusEnum = pgEnum('send_queue_status', [
  'pending',
  'processing',
  'sent',
  'failed',
])

export const sendQueueTypeEnum = pgEnum('send_queue_type', [
  'email',
  'whatsapp_future',
])

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: campaignTypeEnum('type').notNull().default('email'),
  status: campaignStatusEnum('status').notNull().default('draft'),
  segmentFilter: jsonb('segment_filter'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
})

export const campaignRecipients = pgTable('campaign_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  status: recipientStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  error: text('error'),
})

export const sendQueue = pgTable('send_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: sendQueueTypeEnum('type').notNull().default('email'),
  recipient: text('recipient').notNull(),
  templateId: text('template_id'),
  payload: jsonb('payload'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  status: sendQueueStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
})

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
export type SendQueueItem = typeof sendQueue.$inferSelect
