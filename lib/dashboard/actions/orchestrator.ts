import { dashboardActionTools, type DashboardActionName } from '@/lib/dashboard/actions/tools'
import type { DashboardActionPayload } from '@/lib/dashboard/actions/schemas'

type DashboardWorkspace = 'content-performance' | 'aeo-insights'

type DashboardActionResult = {
  jobId: string
  workspace: DashboardWorkspace
  action: DashboardActionName
  status: 'queued'
  trace: {
    tool: DashboardActionName
    summary: string
  }
}

export async function runDashboardAction(args: {
  workspace: DashboardWorkspace
  action: DashboardActionName
  payload: DashboardActionPayload
}): Promise<DashboardActionResult> {
  const summaryByAction: Record<DashboardActionName, string> = {
    'generate-brief': `Brief queued for ${args.payload.domain}`,
    'launch-rewrite': `Rewrite workflow queued for ${args.payload.domain}`,
    'track-query-set': `Query tracking queued for ${args.payload.domain}`,
  }

  const selectedTool = dashboardActionTools[args.action]
  const fallbackSummary = summaryByAction[args.action]

  return {
    jobId: crypto.randomUUID(),
    workspace: args.workspace,
    action: args.action,
    status: 'queued',
    trace: {
      tool: args.action,
      summary: `${selectedTool.description}. ${fallbackSummary}`,
    },
  }
}
