import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import { getDiagnosticResult, toPublicDiagnosticResult } from '@/lib/diagnostic-store'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'

export const runtime = 'edge'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimitResponse = await rateLimitMiddleware(_request, 'GENERAL', userId)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 })
    }

    const result = await getDiagnosticResult(id)
    if (!result) {
      return NextResponse.json({ error: 'Snapshot not found or expired' }, { status: 404 })
    }

    return NextResponse.json(toPublicDiagnosticResult(result))
  } catch (error) {
    console.error('[Diagnostic Result] Failed to fetch snapshot', error)
    return NextResponse.json(
      { error: 'Unable to load snapshot result' },
      { status: 500 },
    )
  }
}
