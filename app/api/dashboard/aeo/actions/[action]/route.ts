import { NextRequest, NextResponse } from 'next/server'

import { requireApiSubscription } from '@/lib/billing/subscription-guard'
import { runDashboardAction } from '@/lib/dashboard/actions/orchestrator'
import { dashboardActionPayloadSchema } from '@/lib/dashboard/actions/schemas'
import type { DashboardActionName } from '@/lib/dashboard/actions/tools'

export const runtime = 'nodejs'

const allowedActions: DashboardActionName[] = ['generate-brief', 'launch-rewrite', 'track-query-set']

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  // Check subscription before processing
  const subscriptionCheck = await requireApiSubscription()
  if (!subscriptionCheck.success) {
    return NextResponse.json(
      {
        error: subscriptionCheck.error?.code || 'subscription_required',
        message: subscriptionCheck.error?.message || 'Active subscription required to access this feature',
      },
      { status: subscriptionCheck.error?.status || 403 }
    )
  }

  const { action } = await context.params
  if (!allowedActions.includes(action as DashboardActionName)) {
    return NextResponse.json({ error: 'unsupported_action', message: 'Unsupported action' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = dashboardActionPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const data = await runDashboardAction({
      workspace: 'aeo-insights',
      action: action as DashboardActionName,
      payload: parsed.data,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[Dashboard][AEO][Action] Failed to queue action', {
      action,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to queue dashboard action' },
      { status: 500 }
    )
  }
}
