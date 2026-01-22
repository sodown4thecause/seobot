import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { db, businessProfiles } from '@/lib/db'
import { eq } from 'drizzle-orm'
// import { type OnboardingData } from '@/lib/onboarding/state'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { userId: requestUserId, stepData } = await req.json()
    
    if (!requestUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current user and verify it matches request
    const userId = await requireUserId()
    
    if (userId !== requestUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if profile exists
    const existing = await db
      .select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1)

    const profileData = {
      userId,
      websiteUrl: stepData.websiteUrl || null,
      industry: stepData.industry || null,
      goals: stepData.goals || null,
      locations: stepData.location ? [stepData.location] : null,
      contentFrequency: stepData.contentFrequency || null,
      updatedAt: new Date(),
    }

    if (existing.length > 0) {
      await db
        .update(businessProfiles)
        .set(profileData)
        .where(eq(businessProfiles.userId, userId))
    } else {
      await db
        .insert(businessProfiles)
        .values(profileData)
    }

    return NextResponse.json({ success: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Save step error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

