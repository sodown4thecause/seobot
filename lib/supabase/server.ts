/**
 * Supabase Server Client with Connection Pooling
 * 
 * Implements singleton pattern and connection pooling to prevent connection exhaustion.
 * Uses pgbouncer-compatible connection string for efficient connection management.
 */

import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { serverEnv, clientEnv } from '@/lib/config/env'

/**
 * Get the pooled connection URL for Supabase
 * Uses the pooler URL if provided, otherwise constructs it from the main URL
 */
function getPooledConnectionUrl(): string {
  // If pooler URL is explicitly provided, use it
  if (serverEnv.SUPABASE_POOLER_URL) {
    return serverEnv.SUPABASE_POOLER_URL
  }

  // Otherwise, construct pooler URL from main URL
  // Supabase pooler uses port 6543 for transaction mode
  const mainUrl = new URL(serverEnv.NEXT_PUBLIC_SUPABASE_URL)
  mainUrl.port = '6543'
  return mainUrl.toString()
}

/**
 * Create a pooled connection string with pgbouncer compatibility
 */
function createPooledConnectionString(baseUrl: string): string {
  const url = new URL(baseUrl)
  // Add pgbouncer=true parameter for transaction mode pooling
  url.searchParams.set('pgbouncer', 'true')
  return url.toString()
}

// ============================================================================
// SINGLETON CLIENT INSTANCES
// ============================================================================

// Singleton for user session client (uses SSR client)
const userClient: ReturnType<typeof createServerClient> | null = null

// Singleton for admin client (uses service role key with pooling)
let adminClient: SupabaseClient | null = null

/**
 * Create or get the user session Supabase client
 * Uses SSR client for cookie-based authentication
 * 
 * @returns Supabase client for user sessions
 */
export async function createClient() {
  // In Next.js, we need to create a new client per request due to cookies
  // But we can still optimize by reusing the connection pool
  const cookieStore = await cookies()

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      // Enable connection pooling for SSR client
      db: {
        schema: 'public',
      },
      // Use pooled connection if available
      ...(serverEnv.SUPABASE_POOLER_URL && {
        global: {
          fetch: (url, options) => {
            // Use pooler URL for database connections
            const poolerUrl = getPooledConnectionUrl()
            const pooledUrl = url.toString().replace(
              serverEnv.NEXT_PUBLIC_SUPABASE_URL,
              poolerUrl
            )
            return fetch(pooledUrl, options)
          },
        },
      }),
    }
  )
}

/**
 * Create or get the admin Supabase client (singleton pattern)
 * Uses service role key with connection pooling enabled
 * 
 * @returns Singleton Supabase admin client
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  const poolerUrl = getPooledConnectionUrl()
  const connectionUrl = createPooledConnectionString(poolerUrl)

  adminClient = createSupabaseClient(
    connectionUrl,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      // Set default timeout for queries (30 seconds)
      global: {
        fetch: async (url, options) => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            })
            clearTimeout(timeoutId)
            return response
          } catch (error: any) {
            clearTimeout(timeoutId)
            if (error.name === 'AbortError') {
              throw new Error('Query timeout: Request exceeded 30 seconds')
            }
            throw error
          }
        },
      },
    }
  )

  return adminClient
}

/**
 * Create a query with timeout and cancellation support
 * 
 * @param queryFn - The query function to execute
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves with query result or rejects on timeout
 */
export async function withQueryTimeout<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await queryFn(controller.signal)
    clearTimeout(timeoutId)
    return result
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(`Query timeout: Request exceeded ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Query guard to prevent expensive operations
 * Validates query parameters before execution
 */
export interface QueryGuardOptions {
  maxRows?: number // Maximum number of rows to return
  maxSelectColumns?: number // Maximum number of columns to select
  allowSelectAll?: boolean // Whether to allow SELECT *
  timeoutMs?: number // Query timeout in milliseconds
}

/**
 * Validate query options against guard rules
 */
export function validateQueryOptions(options: QueryGuardOptions): void {
  if (options.maxRows && options.maxRows > 10000) {
    throw new Error('Query guard: maxRows cannot exceed 10000')
  }

  if (options.maxSelectColumns && options.maxSelectColumns > 50) {
    throw new Error('Query guard: maxSelectColumns cannot exceed 50')
  }
}

/**
 * Get connection pool health metrics (for monitoring)
 * Note: This is a placeholder - actual implementation would require
 * access to Supabase connection pool metrics API
 */
export function getConnectionPoolHealth() {
  return {
    poolerEnabled: !!serverEnv.SUPABASE_POOLER_URL,
    poolerUrl: serverEnv.SUPABASE_POOLER_URL || 'Not configured',
    adminClientInitialized: adminClient !== null,
  }
}
