import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { buildContentPerformanceSnapshot } from '@/lib/dashboard/content-performance/service'

export const runtime = 'nodejs'

const refreshSchema = z.object({
  domain: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  device: z.enum(['desktop', 'mobile']).optional(),
})

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = refreshSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', issues: parsed.error.issues }, { status: 400 })
  }

  const data = await buildContentPerformanceSnapshot({
    domain: parsed.data.domain ?? 'example.com',
    locationName: parsed.data.location,
  })

  return NextResponse.json({
    success: true,
    refreshQueued: true,
    jobId: crypto.randomUUID(),
    data,
  })
}
