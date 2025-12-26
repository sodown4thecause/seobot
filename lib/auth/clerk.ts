/**
 * Clerk Authentication Utilities
 * 
 * Provides authentication using Clerk with custom domain support
 * Docs: https://clerk.com/docs
 */

import { auth, currentUser } from '@clerk/nextjs/server'

// Get current user (server-side)
export async function getCurrentUser() {
    return await currentUser()
}

// Get current user or throw error
export async function requireUser() {
    const user = await currentUser()
    if (!user) {
        throw new Error('Authentication required')
    }
    return user
}

// Get user ID for database queries
export async function getUserId(): Promise<string | null> {
    const { userId } = await auth()
    return userId
}

// Require user ID (throws if not authenticated)
export async function requireUserId(): Promise<string> {
    const { userId } = await auth()
    if (!userId) {
        throw new Error('Authentication required')
    }
    return userId
}

// Sign out user (client-side only - use useClerk hook)
// This is a placeholder for consistency with the old API
export function signOut() {
    throw new Error('Use useClerk().signOut() on the client side')
}
