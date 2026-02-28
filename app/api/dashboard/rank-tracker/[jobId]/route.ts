import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { getDashboardJobById } from '@/lib/dashboard/repository'

export const runtime = 'nodejs'

const paramsSchema = z.object({
  jobId: z.string().uuid(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const parsedParams = paramsSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json({ error: 'Invalid job id', issues: parsedParams.error.issues }, { status: 400 })
    }

    const job = await getDashboardJobById(userId, 'ranks', parsedParams.data.jobId)
    if (!job) {
      return NextResponse.json({ error: 'Rank tracker job not found' }, { status: 404 })
    }

    return NextResponse.json({
      jobId: job.jobId,
      dataType: job.dataType,
      status: job.status,
      websiteUrl: job.websiteUrl,
      createdAt: job.createdAt,
      lastUpdated: job.lastUpdated,
      snapshot: job.snapshot,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read rank tracker job' },
      { status: 500 }
    )
  }
}
