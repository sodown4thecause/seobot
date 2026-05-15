/**
 * Auth User API
 *
 * Returns the current user's information using Better Auth.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-config'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.name?.split(' ')[0] || null,
        lastName: session.user.name?.split(' ').slice(1).join(' ') || null,
        fullName: session.user.name,
        imageUrl: session.user.image,
      },
    })
  } catch (error) {
    console.error('[Auth API] Error:', error)
    return NextResponse.json({ user: null, error: 'Auth check failed' }, { status: 500 })
  }
}