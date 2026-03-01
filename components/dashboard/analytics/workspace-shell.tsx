'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { WorkspaceActionQueue, type WorkspaceActionItem } from '@/components/dashboard/analytics/workspace-action-queue'
import { WorkspaceHistory, type WorkspaceHistoryItem } from '@/components/dashboard/analytics/workspace-history'
import { WorkspaceKpiStrip, type WorkspaceKpiItem } from '@/components/dashboard/analytics/workspace-kpi-strip'
import { WorkspaceTabs, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-tabs'
import { WorkspaceToolbar } from '@/components/dashboard/analytics/workspace-toolbar'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'
import { saveWorkspaceView } from '@/lib/dashboard/analytics/saved-views'
import { enqueueWorkspaceExport } from '@/lib/dashboard/analytics/export-service'

type WorkspaceKey = 'content-performance' | 'aeo-insights'

interface WorkspaceShellProps {
  workspace: WorkspaceKey
  title: string
  description?: string
  kpis: WorkspaceKpiItem[]
  tabs: WorkspaceTabItem[]
  defaultTab?: string
  actionQueue: WorkspaceActionItem[]
  history: WorkspaceHistoryItem[]
  filters?: Record<string, unknown>
}

export function WorkspaceShell({
  workspace,
  title,
  description,
  kpis,
  tabs,
  defaultTab,
  actionQueue,
  history,
  filters = {},
}: WorkspaceShellProps) {
  const handleSaveView = useCallback(() => {
    void saveWorkspaceView('current-user', workspace, filters)
  }, [filters, workspace])

  const handleExport = useCallback(() => {
    void enqueueWorkspaceExport('current-user', workspace, filters)
  }, [filters, workspace])

  return (
    <div className="space-y-6">
      <Card className={workspaceThemeTokens.surface.shellCard}>
        <CardHeader>
          <WorkspaceToolbar title={title} description={description} onSaveView={handleSaveView} onExport={handleExport} />
        </CardHeader>
        <CardContent className="space-y-6">
          <WorkspaceKpiStrip items={kpis} />
          <WorkspaceTabs tabs={tabs} defaultTab={defaultTab} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <WorkspaceActionQueue items={actionQueue} />
            <WorkspaceHistory entries={history} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export type { WorkspaceActionItem, WorkspaceHistoryItem, WorkspaceKpiItem, WorkspaceTabItem }
