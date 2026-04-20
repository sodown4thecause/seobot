import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireApiSubscription } from '@/lib/billing/subscription-guard'
import { saveDashboardSnapshot } from '@/lib/dashboard/repository'
import { runRankTracker } from '@/lib/dashboard/rank-tracker/service'

export const runtime = 'nodejs'

const runRankTrackerSchema = z.object({
  domain: z.string().trim().min(1),
  competitors: z.array(z.string().trim().min(1)).max(5).optional(),
  keywordLimit: z.number().int().min(1).max(100).optional(),
  locationName: z.string().trim().min(1).optional(),
  languageCode: z.string().trim().min(2).max(5).optional(),
  serpDepth: z.number().int().min(10).max(100).optional(),
  firecrawlLimit: z.number().int().min(1).max(20).optional(),
  historicalKeywordLimit: z.number().int().min(1).max(5).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check subscription before processing
    const subscriptionCheck = await requireApiSubscription()
    if (!subscriptionCheck.success) {
      return NextResponse.json(
        { error: subscriptionCheck.error?.message || 'Subscription required' },
        { status: subscriptionCheck.error?.status || 403 }
      )
    }

    const userId = subscriptionCheck.userId

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parsed = runRankTrackerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload', issues: parsed.error.issues }, { status: 400 })
    }

    const snapshot = await runRankTracker({ ...parsed.data, userId })
    const jobId = crypto.randomUUID()

    const saved = await saveDashboardSnapshot({
      userId,
      websiteUrl: parsed.data.domain,
      dataType: 'ranks',
      jobId,
      snapshot,
    })

    return NextResponse.json({
      jobId: saved.jobId,
      dataType: saved.dataType,
      status: saved.status,
      websiteUrl: saved.websiteUrl,
      createdAt: saved.createdAt,
      snapshot: saved.snapshot,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run rank tracker' },
      { status: 500 }
    )
  }
}
