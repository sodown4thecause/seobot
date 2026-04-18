/**
 * Neon Database Client with RLS middleware
 *
 * Provides two database clients:
 * - `db`: Admin client (neondb_owner) - bypasses RLS, used for migrations/webhooks/background jobs
 * - `dbAuth`: Authenticated client - enforces RLS, used for user-facing API routes
 *
 * The authenticated client wraps each request in a transaction that sets
 * the Clerk user ID as a session variable, which the auth.uid() RLS function reads.
 *
 * Usage in API routes:
 *   import { dbAuth } from '@/lib/db'
 *   const data = await dbAuth(userId, (tx) => tx.select().from(businessProfiles))
 *
 * Usage for admin/migration:
 *   import { db } from '@/lib/db'
 *   await db.insert(businessProfiles).values(...)
 */

import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { sql } from 'drizzle-orm'

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true

// ---------------------------------------------------------------------------
// Admin client (neondb_owner) - bypasses RLS, for migrations/webhooks/admin
// ---------------------------------------------------------------------------
const adminSql = neon(process.env.DATABASE_URL!)
export const db = drizzle(adminSql, { schema })

// ---------------------------------------------------------------------------
// Authenticated client - enforces RLS per user
// Uses DATABASE_AUTHENTICATED_URL with the authenticated_backend role
// Falls back to DATABASE_URL if AUTHENTICATED url not set (RLS still works
// if ALTER ROLE ... FORCE ROW LEVEL SECURITY is applied)
// ---------------------------------------------------------------------------
const authenticatedSql = neon(process.env.DATABASE_AUTHENTICATED_URL || process.env.DATABASE_URL!)
const dbAuthenticated = drizzle(authenticatedSql, { schema })

/**
 * Execute a database operation with Row Level Security enforcement.
 *
 * Wraps the operation in a transaction that sets the user's Clerk ID
 * as a session variable, which auth.uid() reads in RLS policies.
 *
 * @param userId - The Clerk user ID (from auth())
 * @param callback - The database operation to execute
 * @returns The result of the callback
 *
 * @example
 *   const profiles = await dbAuth(userId, (tx) =>
 *     tx.select().from(businessProfiles).where(eq(businessProfiles.userId, userId))
 *   )
 */
export async function dbAuth<T>(
    userId: string,
    callback: (tx: any) => Promise<T>
): Promise<T> {
    return dbAuthenticated.transaction(async (tx) => {
        // Set the session variable that auth.uid() reads from
        // This is scoped to the transaction and resets after
        await tx.execute(sql`SELECT set_config('request.jwt.claims.sub', ${userId}, true)`)
        return callback(tx as any)
    })
}

// ---------------------------------------------------------------------------
// Service client - bypasses RLS for background jobs/webhooks
// Uses DATABASE_URL (neondb_owner with BYPASSRLS)
// Same as `db` but explicit naming for clarity
// ---------------------------------------------------------------------------
export const dbService = db

// ---------------------------------------------------------------------------
// Legacy exports (unchanged for backward compatibility)
// ---------------------------------------------------------------------------
export * from './schema'
export * from './vector-search'

export type Database = typeof db