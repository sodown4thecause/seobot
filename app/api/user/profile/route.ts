import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { businessProfiles, brandVoices, competitors, keywords } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data in parallel for performance
    const [profileResults, brandVoiceResults, competitorResults, keywordResults] = await Promise.all([
      db
        .select({
          id: businessProfiles.id,
          websiteUrl: businessProfiles.websiteUrl,
          industry: businessProfiles.industry,
          goals: businessProfiles.goals,
          locations: businessProfiles.locations,
          contentFrequency: businessProfiles.contentFrequency,
        })
        .from(businessProfiles)
        .where(eq(businessProfiles.userId, userId))
        .limit(1),
      db
        .select({
          id: brandVoices.id,
          tone: brandVoices.tone,
          style: brandVoices.style,
          personality: brandVoices.personality,
          samplePhrases: brandVoices.samplePhrases,
        })
        .from(brandVoices)
        .where(eq(brandVoices.userId, userId))
        .limit(1),
      db
        .select({
          id: competitors.id,
          domain: competitors.domain,
          domainAuthority: competitors.domainAuthority,
          monthlyTraffic: competitors.monthlyTraffic,
          priority: competitors.priority,
        })
        .from(competitors)
        .where(eq(competitors.userId, userId)),
      db
        .select({
          id: keywords.id,
          keyword: keywords.keyword,
          searchVolume: keywords.searchVolume,
          keywordDifficulty: keywords.keywordDifficulty,
          currentRanking: keywords.currentRanking,
          intent: keywords.intent,
          priority: keywords.priority,
        })
        .from(keywords)
        .where(eq(keywords.userId, userId)),
    ])

    const profile = profileResults[0] || null
    const brandVoice = brandVoiceResults[0] || null

    if (!profile) {
      return NextResponse.json({
        profile: null,
        brandVoice: null,
        competitors: [],
        keywords: []
      }, { status: 404 })
    }

    return NextResponse.json({
      profile,
      brandVoice,
      competitors: competitorResults,
      keywords: keywordResults,
    })
  } catch (error) {
    console.error('[API] Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
