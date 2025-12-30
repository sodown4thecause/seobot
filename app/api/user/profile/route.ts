import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profiles = await db
      .select({
        id: businessProfiles.id,
        websiteUrl: businessProfiles.websiteUrl,
        industry: businessProfiles.industry,
      })
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1)

    const profile = profiles[0]

    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[API] Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
