import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { clients } from './clients'
import { profiles } from './auth'

export const voiceStatusEnum = pgEnum('voice_status', [
  'pending',
  'transcribed',
  'acknowledged',
  'resolved',
  'failed',
])

export const recipientRoleEnum = pgEnum('recipient_role', [
  'vendedor',
  'admin_general',
  'admin_secundario',
])

export const messageDirectionEnum = pgEnum('message_direction', [
  'inbound',
  'outbound',
])

export const voiceConsultations = pgTable('voice_consultations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  recipientRole: recipientRoleEnum('recipient_role').notNull(),
  transcript: text('transcript'),
  audioUrl: text('audio_url'),
  status: voiceStatusEnum('status').notNull().default('pending'),
  assignedTo: uuid('assigned_to').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// FUTURE — table created for forward-compatibility with Wati.io (post-MVP)
export const watiMessages = pgTable('wati_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  watiMessageId: text('wati_message_id').unique(),
  direction: messageDirectionEnum('direction').notNull(),
  fromNumber: text('from_number'),
  toNumber: text('to_number'),
  content: text('content'),
  status: text('status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type VoiceConsultation = typeof voiceConsultations.$inferSelect
export type WatiMessage = typeof watiMessages.$inferSelect
