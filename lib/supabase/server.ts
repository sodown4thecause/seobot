/**
 * Supabase Server Compatibility Shim
 * 
 * This file provides backward compatibility for server components
 * that still import from @/lib/supabase/server.
 * 
 * TODO: Migrate all usages to use @/lib/db and @/lib/auth/clerk directly
 * @deprecated Use @/lib/db for database and @/lib/auth/clerk for auth
 */

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// Type for Clerk user mapped to Supabase-like structure
interface CompatUser {
    id: string
    email?: string
    user_metadata?: {
        full_name?: string
        avatar_url?: string
    }
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    imageUrl?: string
}

/**
 * @deprecated Use getCurrentUser from @/lib/auth/clerk instead
 * Compatibility function - returns a mock Supabase-like client
 */
export async function createClient() {
    return createShimClient()
}

/**
 * @deprecated Use db from @/lib/db instead
 * Compatibility function - alias for createClient for admin operations
 */
export async function createAdminClient() {
    return createShimClient()
}

async function createShimClient() {
    return {
        auth: {
            getUser: async () => {
                const auth = await import('@/lib/auth/clerk')
                const clerkUser = await auth.getCurrentUser()
                
                if (!clerkUser) {
                    return {
                        data: { user: null },
                        error: { message: 'Not authenticated' }
                    }
                }
                
                // Map Clerk user to Supabase-compatible format
                const user: CompatUser = {
                    id: clerkUser.id,
                    email: clerkUser.emailAddresses?.[0]?.emailAddress,
                    user_metadata: {
                        full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined,
                        avatar_url: clerkUser.imageUrl,
                    },
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    fullName: clerkUser.fullName,
                    imageUrl: clerkUser.imageUrl,
                }
                
                return {
                    data: { user },
                    error: null
                }
            },
            signOut: async () => {
                throw new Error('Use useClerk().signOut() on the client side')
            },
            getSession: async () => {
                const auth = await import('@/lib/auth/clerk')
                const user = await auth.getCurrentUser()
                return {
                    data: { session: user ? { user } : null },
                    error: null
                }
            }
        },
        from: (table: string) => createTableQuery(table),
        rpc: (functionName: string, params?: Record<string, unknown>) => createRpcQuery(functionName, params),
        storage: createStorageShim(),
    }
}

function createTableQuery(tableName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
        select: (columns?: string, opts?: { count?: string }) => query,
        eq: (col: string, val: unknown) => query,
        neq: (col: string, val: unknown) => query,
        gt: (col: string, val: unknown) => query,
        gte: (col: string, val: unknown) => query,
        lt: (col: string, val: unknown) => query,
        lte: (col: string, val: unknown) => query,
        like: (col: string, val: unknown) => query,
        ilike: (col: string, val: unknown) => query,
        is: (col: string, val: unknown) => query,
        in: (col: string, val: unknown[]) => query,
        order: (col: string, opts?: { ascending?: boolean }) => query,
        limit: (n: number) => query,
        range: (from: number, to: number) => query,
        single: async () => ({ data: null, error: { message: 'Migrate to Drizzle' } }),
        maybeSingle: async () => ({ data: null, error: null }),
    }

    query.insert = (data: unknown) => ({
        select: () => ({
            single: async () => ({ data: null, error: { message: 'Migrate to Drizzle' } }),
        }),
    })

    query.update = (data: unknown) => query
    query.upsert = (data: unknown, opts?: unknown) => query
    query.delete = () => query

    query.then = async (resolve: (result: { data: unknown[]; error: { message: string } | null; count?: number }) => void) => {
        resolve({ data: [], error: { message: 'Migrate to Drizzle' }, count: 0 })
    }

    return query
}

function createStorageShim() {
    return {
        from: (bucket: string) => ({
            upload: async (path: string, data: Buffer | Uint8Array, options?: { contentType?: string; cacheControl?: string }) => {
                try {
                    const { uploadToR2 } = await import('@/lib/storage/r2-client')
                    const result = await uploadToR2(path, data, {
                        contentType: options?.contentType,
                        cacheControl: options?.cacheControl,
                    })
                    if (result.success) {
                        return { data: { path: result.key }, error: null }
                    }
                    return { data: null, error: { message: result.error || 'Upload failed' } }
                } catch (error) {
                    return { data: null, error: { message: String(error) } }
                }
            },
            getPublicUrl: (path: string) => {
                const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
                const bucketName = process.env.R2_BUCKET_NAME || 'imagebucket'
                return { data: { publicUrl: `${endpoint}/${bucketName}/${path}` } }
            },
            download: async (path: string) => {
                return { data: null, error: { message: 'Not implemented' } }
            },
            remove: async (paths: string[]) => {
                try {
                    const { deleteFromR2 } = await import('@/lib/storage/r2-client')
                    await Promise.all(paths.map(p => deleteFromR2(p)))
                    return { data: null, error: null }
                } catch (error) {
                    return { data: null, error: { message: String(error) } }
                }
            },
        }),
    }
}

function createRpcQuery(functionName: string, params?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
        single: async () => {
            try {
                const result = await executeRpc(functionName, params)
                return { data: result, error: null }
            } catch (error) {
                return { data: null, error: { message: String(error) } }
            }
        },
        maybeSingle: async () => {
            try {
                const result = await executeRpc(functionName, params)
                return { data: result, error: null }
            } catch {
                return { data: null, error: null }
            }
        },
    }

    query.then = async (resolve: (result: { data: unknown; error: { message: string } | null }) => void) => {
        try {
            const result = await executeRpc(functionName, params)
            resolve({ data: result, error: null })
        } catch (error) {
            resolve({ data: null, error: { message: String(error) } })
        }
    }

    return query
}

async function executeRpc(functionName: string, params?: Record<string, unknown>): Promise<unknown> {
    switch (functionName) {
        case 'aggregate_usage_summary':
            return aggregateUsageSummary(params)
        case 'aggregate_user_stats':
            return aggregateUserStats(params)
        case 'aggregate_provider_stats':
            return aggregateProviderStats(params)
        case 'aggregate_model_stats':
            return aggregateModelStats(params)
        case 'record_workflow_completion':
        case 'record_error_recovery':
        case 'get_workflow_insights':
        case 'calculate_success_rate':
        case 'get_context_messages':
        case 'store_context_message':
            return { success: true }
        default:
            console.warn(`[RPC Migration] Unknown RPC function: ${functionName}`)
            return null
    }
}

async function aggregateUsageSummary(params?: Record<string, unknown>) {
    try {
        const { p_user_id, p_from, p_to } = (params || {}) as { p_user_id?: string; p_from?: string; p_to?: string }
        
        const conditions: string[] = ['TRUE']
        if (p_user_id) conditions.push(`user_id = '${p_user_id}'`)
        if (p_from) conditions.push(`created_at >= '${p_from}'::timestamp`)
        if (p_to) conditions.push(`created_at <= '${p_to}'::timestamp`)

        const result = await db.execute(sql.raw(`
            SELECT 
                COUNT(*)::int as total_calls,
                COUNT(DISTINCT user_id)::int as active_users,
                COALESCE(SUM((metadata->>'cost_usd')::float), 0) as total_cost,
                COALESCE(SUM(COALESCE(prompt_tokens, 0)) + SUM(COALESCE(completion_tokens, 0)), 0)::int as total_tokens
            FROM ai_usage_events
            WHERE ${conditions.join(' AND ')}
        `))
        return (result.rows as Record<string, unknown>[])[0] || null
    } catch (error) {
        console.error('[RPC] aggregateUsageSummary error:', error)
        return null
    }
}

async function aggregateUserStats(params?: Record<string, unknown>) {
    try {
        const { p_user_id, p_from, p_to, p_limit = 50, p_offset = 0 } = (params || {}) as { 
            p_user_id?: string; p_from?: string; p_to?: string; p_limit?: number; p_offset?: number 
        }

        const conditions: string[] = ['TRUE']
        if (p_user_id) conditions.push(`user_id = '${p_user_id}'`)
        if (p_from) conditions.push(`created_at >= '${p_from}'::timestamp`)
        if (p_to) conditions.push(`created_at <= '${p_to}'::timestamp`)

        const result = await db.execute(sql.raw(`
            SELECT 
                user_id,
                COUNT(*)::int as usage_count,
                COALESCE(SUM((metadata->>'cost_usd')::float), 0) as total_cost,
                COALESCE(SUM(COALESCE(prompt_tokens, 0)) + SUM(COALESCE(completion_tokens, 0)), 0)::int as total_tokens,
                MAX(created_at) as last_used
            FROM ai_usage_events
            WHERE ${conditions.join(' AND ')}
            GROUP BY user_id
            ORDER BY usage_count DESC
            LIMIT ${p_limit} OFFSET ${p_offset}
        `))
        return (result.rows as Record<string, unknown>[]) || []
    } catch (error) {
        console.error('[RPC] aggregateUserStats error:', error)
        return []
    }
}

async function aggregateProviderStats(params?: Record<string, unknown>) {
    try {
        const { p_user_id, p_from, p_to } = (params || {}) as { p_user_id?: string; p_from?: string; p_to?: string }

        const conditions: string[] = ['TRUE']
        if (p_user_id) conditions.push(`user_id = '${p_user_id}'`)
        if (p_from) conditions.push(`created_at >= '${p_from}'::timestamp`)
        if (p_to) conditions.push(`created_at <= '${p_to}'::timestamp`)

        const result = await db.execute(sql.raw(`
            SELECT 
                COALESCE(metadata->>'provider', 'unknown') as provider,
                COUNT(*)::int as usage_count,
                COALESCE(SUM((metadata->>'cost_usd')::float), 0) as total_cost,
                COALESCE(SUM(COALESCE(prompt_tokens, 0)) + SUM(COALESCE(completion_tokens, 0)), 0)::int as total_tokens
            FROM ai_usage_events
            WHERE ${conditions.join(' AND ')}
            GROUP BY COALESCE(metadata->>'provider', 'unknown')
            ORDER BY total_cost DESC
        `))
        return (result.rows as Record<string, unknown>[]) || []
    } catch (error) {
        console.error('[RPC] aggregateProviderStats error:', error)
        return []
    }
}

async function aggregateModelStats(params?: Record<string, unknown>) {
    try {
        const { p_user_id, p_from, p_to, p_limit = 20 } = (params || {}) as { 
            p_user_id?: string; p_from?: string; p_to?: string; p_limit?: number 
        }

        const conditions: string[] = ['TRUE']
        if (p_user_id) conditions.push(`user_id = '${p_user_id}'`)
        if (p_from) conditions.push(`created_at >= '${p_from}'::timestamp`)
        if (p_to) conditions.push(`created_at <= '${p_to}'::timestamp`)

        const result = await db.execute(sql.raw(`
            SELECT 
                COALESCE(metadata->>'model', 'unknown') as model,
                COUNT(*)::int as usage_count,
                COALESCE(SUM((metadata->>'cost_usd')::float), 0) as total_cost,
                COALESCE(SUM(COALESCE(prompt_tokens, 0)) + SUM(COALESCE(completion_tokens, 0)), 0)::int as total_tokens
            FROM ai_usage_events
            WHERE ${conditions.join(' AND ')}
            GROUP BY COALESCE(metadata->>'model', 'unknown')
            ORDER BY total_cost DESC
            LIMIT ${p_limit}
        `))
        return (result.rows as Record<string, unknown>[]) || []
    } catch (error) {
        console.error('[RPC] aggregateModelStats error:', error)
        return []
    }
}
