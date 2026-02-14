import { NextRequest, NextResponse } from 'next/server'

import { getDiagnosticResult, toPublicDiagnosticResult } from '@/lib/diagnostic-store'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 })
    }

    const result = getDiagnosticResult(id)
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
