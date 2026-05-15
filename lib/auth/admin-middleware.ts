/**
 * Admin Middleware Helper - Better Auth Implementation
 *
 * Provides reusable admin access checks for API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-config'
import { headers } from 'next/headers'

export async function requireAdminMiddleware(_req: NextRequest): Promise<NextResponse | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    return null
  } catch (error) {
    console.error('[Admin Middleware] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}