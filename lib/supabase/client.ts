/**
 * Supabase Client Compatibility Shim
 * 
 * This file provides backward compatibility for components
 * that still import from @/lib/supabase/client.
 * 
 * TODO: Migrate all usages to use @/lib/db and @/lib/auth/clerk directly
 * @deprecated Use @/lib/db for database and @/lib/auth/clerk for auth
 */

'use client'

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
 * @deprecated Use useUser from @clerk/nextjs instead
 * Compatibility function - returns a mock Supabase-like client
 */
export function createClient() {
    return {
        auth: {
            getUser: async () => {
                // For client-side, we need to use fetch to get user
                // In production, use useUser hook from @clerk/nextjs instead
                try {
                    const response = await fetch('/api/auth/user')
                    if (response.ok) {
                        const data = await response.json()
                        if (data.user) {
                            const user: CompatUser = {
                                id: data.user.id,
                                email: data.user.email,
                                user_metadata: {
                                    full_name: data.user.fullName,
                                    avatar_url: data.user.imageUrl,
                                },
                                firstName: data.user.firstName,
                                lastName: data.user.lastName,
                                fullName: data.user.fullName,
                                imageUrl: data.user.imageUrl,
                            }
                            return { data: { user }, error: null }
                        }
                    }
                    return { data: { user: null }, error: { message: 'Not authenticated' } }
                } catch {
                    return { data: { user: null }, error: { message: 'Auth check failed' } }
                }
            },
            signOut: async () => {
                // Use useClerk().signOut() on client side instead
                throw new Error('Use useClerk().signOut() from @clerk/nextjs')
            },
            getSession: async () => {
                try {
                    const response = await fetch('/api/auth/user')
                    if (response.ok) {
                        const data = await response.json()
                        return {
                            data: { session: data.user ? { user: data.user } : null },
                            error: null
                        }
                    }
                    return { data: { session: null }, error: null }
                } catch {
                    return { data: { session: null }, error: null }
                }
            },
            onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
                // No-op for compatibility - Clerk handles this differently
                return {
                    data: { subscription: { unsubscribe: () => { } } }
                }
            }
        },
        from: (table: string) => createTableQuery(table),
        rpc: (functionName: string, params?: Record<string, unknown>) => createRpcQuery(functionName, params),
        storage: createStorageShim(),
    }
}

function createRpcQuery(functionName: string, _params?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
        single: async () => {
            console.warn(`[Migration] RPC '${functionName}' called on client - use server action`)
            return { data: null, error: null }
        },
        maybeSingle: async () => {
            return { data: null, error: null }
        },
    }

    query.then = async (resolve: (result: { data: unknown; error: null }) => void) => {
        resolve({ data: null, error: null })
    }

    return query
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
        contains: (col: string, val: unknown) => query,
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

    query.then = async (resolve: (result: { data: unknown[]; error: { message: string } | null }) => void) => {
        resolve({ data: [], error: { message: 'Migrate to Drizzle' } })
    }

    return query
}

function createStorageShim() {
    return {
        from: (bucket: string) => ({
            upload: async (path: string, data: Blob | File, options?: { contentType?: string; cacheControl?: string }) => {
                console.warn('[Migration] Storage upload not available on client - use server action')
                return { data: null, error: { message: 'Use server action for uploads' } }
            },
            getPublicUrl: (path: string) => {
                const endpoint = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 
                    `https://${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
                const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || 'imagebucket'
                return { data: { publicUrl: `${endpoint}/${bucketName}/${path}` } }
            },
            download: async (path: string) => {
                return { data: null, error: { message: 'Not implemented' } }
            },
            remove: async (paths: string[]) => {
                console.warn('[Migration] Storage remove not available on client - use server action')
                return { data: null, error: { message: 'Use server action for deletions' } }
            },
        }),
    }
}
