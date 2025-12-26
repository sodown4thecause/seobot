/**
 * Neon Database Client with Drizzle ORM
 * 
 * Serverless-compatible database client using @neondatabase/serverless
 */

import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true

// Create SQL client
const sql = neon(process.env.DATABASE_URL!)

// Create Drizzle client with schema
export const db = drizzle(sql, { schema })

// Export schema for convenience
export * from './schema'

// Type for the database instance
export type Database = typeof db
