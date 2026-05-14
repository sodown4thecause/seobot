/**
 * Admin Role Checker - Better Auth Implementation
 *
 * Checks if a user has admin privileges via Better Auth admin plugin.
 */

import { auth } from '@/lib/auth-config'
import { headers } from 'next/headers'

export async function isAdmin(userId?: string | null): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return false
    }

    if (userId && session.user.id !== userId) {
      return false
    }

    if (session.user.role === 'admin') {
      return true
    }

    return false
  } catch (error) {
    console.error('[Admin Check] Error checking admin status:', error)
    return false
  }
}

export async function requireAdmin(userId: string | null | undefined): Promise<void> {
  const admin = await isAdmin(userId)
  if (!admin) {
    throw new Error('Admin access required')
  }
}