import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { saveDashboardSnapshot } from '@/lib/dashboard/repository'
import { runWebsiteAudit } from '@/lib/dashboard/website-audit/service'

export const runtime = 'nodejs'

const runWebsiteAuditSchema = z.object({
  domain: z.string().trim().min(1),
  maxUrls: z.number().int().min(1).max(10).optional(),
  firecrawlLimit: z.number().int().min(1).max(50).optional(),
  includeJinaScreenshot: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parsed = runWebsiteAuditSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload', issues: parsed.error.issues }, { status: 400 })
    }

    const snapshot = await runWebsiteAudit({ ...parsed.data, userId })
    const jobId = crypto.randomUUID()

    const saved = await saveDashboardSnapshot({
      userId,
      websiteUrl: parsed.data.domain,
      dataType: 'audit',
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
    console.error('[Dashboard Website Audit] Failed to run audit:', error)
    return NextResponse.json(
      { error: 'Failed to run website audit' },
      { status: 500 }
    )
  }
}
