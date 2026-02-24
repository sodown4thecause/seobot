import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { sendRefreshRequest } from '@/lib/jobs/inngest-client'
import { invalidateDashboardCache } from '@/lib/cache/redis-client'

type RefreshJobType = 'full-refresh' | 'ranks-only' | 'backlinks-only' | 'audit-only' | 'overview-only'

interface RefreshRequestBody {
  websiteUrl?: string
  competitorUrls?: string[]
  jobType?: RefreshJobType
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as RefreshRequestBody

  let websiteUrl = body.websiteUrl
  if (!websiteUrl) {
    const profile = await db
      .select({ websiteUrl: businessProfiles.websiteUrl })
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1)

    websiteUrl = profile[0]?.websiteUrl
  }

  if (!websiteUrl) {
    return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
  }

  const jobType = body.jobType ?? 'full-refresh'

  await invalidateDashboardCache(userId)
  await sendRefreshRequest(userId, websiteUrl, jobType, body.competitorUrls)

  return NextResponse.json({ ok: true, invalidatedCache: true })
}
