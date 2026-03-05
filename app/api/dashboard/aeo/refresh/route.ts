import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { buildAeoInsightsSnapshot } from '@/lib/dashboard/aeo/service'

export const runtime = 'nodejs'

const refreshSchema = z.object({
  domain: z.string().trim().min(1).optional(),
  promptCluster: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
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

  const keywords = parsed.data.promptCluster
    ? parsed.data.promptCluster.split(',').map((keyword) => keyword.trim())
    : ['seo reporting']

  try {
    const data = await buildAeoInsightsSnapshot({
      domain: parsed.data.domain,
      keywords,
      locationName: parsed.data.location,
    })

    return NextResponse.json({
      success: true,
      refreshed: true,
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to refresh AEO insights snapshot'
    if (message === 'At least one keyword is required') {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    console.error('[Dashboard][AEO][Refresh] Failed to refresh snapshot', {
      domain: parsed.data.domain,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to refresh AEO insights snapshot' },
      { status: 500 }
    )
  }
}
