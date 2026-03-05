import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import { buildContentPerformanceSnapshot } from '@/lib/dashboard/content-performance/service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const domain = request.nextUrl.searchParams.get('domain')?.trim()
  if (!domain) {
    return NextResponse.json({ error: 'Missing required query parameter: domain' }, { status: 400 })
  }

  try {
    const data = await buildContentPerformanceSnapshot({ domain })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load content performance snapshot' },
      { status: 500 }
    )
  }
}
