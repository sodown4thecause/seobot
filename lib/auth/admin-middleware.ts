/**
 * Admin Middleware Helper
 * Provides reusable admin access checks for API routes with Clerk
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { isAdmin } from './admin-check'

/**
 * Middleware to check admin access in API routes
 * Returns null if admin, or a NextResponse with error if not
 */
export async function requireAdminMiddleware(_req: NextRequest): Promise<NextResponse | null> {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    return null // Admin check passed
  } catch (error) {
    console.error('[Admin Middleware] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
