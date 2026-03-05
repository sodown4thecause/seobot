import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import { buildAeoInsightsSnapshot } from '@/lib/dashboard/aeo/service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const queryKeywords = request.nextUrl.searchParams.getAll('keyword')
  try {
    const data = await buildAeoInsightsSnapshot({
      keywords: queryKeywords,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load AEO insights snapshot'
    if (message === 'At least one keyword is required') {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
