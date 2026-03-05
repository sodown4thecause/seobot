import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import { buildAeoInsightsSnapshot } from '@/lib/dashboard/aeo/service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const queryKeywords = request.nextUrl.searchParams
    .getAll('keyword')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0)

  if (queryKeywords.length === 0) {
    return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 })
  }

  try {
    const data = await buildAeoInsightsSnapshot({
      keywords: queryKeywords,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[Dashboard][AEO][Snapshot] Failed to load snapshot', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to load AEO insights snapshot' },
      { status: 500 }
    )
  }
}
