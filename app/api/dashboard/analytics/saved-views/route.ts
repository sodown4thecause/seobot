import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { saveWorkspaceView } from '@/lib/dashboard/analytics/saved-views'

export const runtime = 'nodejs'

const requestSchema = z.object({
  workspace: z.enum(['content-performance', 'aeo-insights']),
  filters: z.record(z.unknown()).optional(),
  name: z.string().trim().min(1).optional(),
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
    const view = await saveWorkspaceView(
      userId,
      parsed.data.workspace,
      parsed.data.filters ?? {},
      parsed.data.name
    )

    return NextResponse.json({ success: true, view })
  } catch (error) {
    console.error('[Dashboard][Analytics][SavedViews] Failed to save view', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({ error: 'Failed to save workspace view' }, { status: 500 })
  }
}
