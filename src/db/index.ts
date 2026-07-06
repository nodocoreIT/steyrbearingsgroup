import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// For query purposes (connection pooler URL recommended for Supabase)
const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it's not supported on Supabase connection pooler
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

export type Database = typeof db
