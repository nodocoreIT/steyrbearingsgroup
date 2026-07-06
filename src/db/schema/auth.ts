import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const appRoleEnum = pgEnum('app_role', [
  'admin_general',
  'admin_secundario',
  'vendedor',
  'cliente',
])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // FK -> auth.users.id
  fullName: text('full_name').notNull(),
  companyName: text('company_name'),
  phone: text('phone'),
  role: appRoleEnum('role').notNull().default('cliente'),
  assignedSalespersonId: uuid('assigned_salesperson_id'),
  // Default price list for salesperson quotes — null means use client's assigned list
  defaultPriceListId: uuid('default_price_list_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type AppRole = typeof appRoleEnum.enumValues[number]
