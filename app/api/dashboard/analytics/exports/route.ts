import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { enqueueWorkspaceExport } from '@/lib/dashboard/analytics/export-service'

export const runtime = 'nodejs'

const requestSchema = z.object({
  workspace: z.enum(['content-performance', 'aeo-insights']),
  filters: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
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

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const job = await enqueueWorkspaceExport(userId, parsed.data.workspace, parsed.data.filters ?? {})
    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('[Dashboard][Analytics][Exports] Failed to enqueue export', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({ error: 'Failed to queue export job' }, { status: 500 })
  }
}
