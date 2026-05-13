'use client'

import { useCallback, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkspaceActionQueue, type WorkspaceActionItem } from '@/components/dashboard/analytics/workspace-action-queue'
import { WorkspaceHistory, type WorkspaceHistoryItem } from '@/components/dashboard/analytics/workspace-history'
import { WorkspaceKpiStrip, type WorkspaceKpiItem } from '@/components/dashboard/analytics/workspace-kpi-strip'
import { WorkspaceTabs, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-tabs'
import { WorkspaceToolbar } from '@/components/dashboard/analytics/workspace-toolbar'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'
import { cn } from '@/lib/utils'

type WorkspaceKey = 'content-performance' | 'aeo-insights'

type ToastState = { type: 'success' | 'error'; message: string } | null

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
  isLoading?: boolean
  isFetching?: boolean
  isRefreshing?: boolean
  onRefresh?: () => Promise<unknown>
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
  isLoading = false,
  isFetching = false,
  isRefreshing = false,
  onRefresh,
}: WorkspaceShellProps) {
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const postWorkspaceAction = useCallback(
    async (endpoint: string) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workspace, filters }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    },
    [filters, workspace]
  )

  const handleSaveView = useCallback(async () => {
    try {
      await postWorkspaceAction('/api/dashboard/analytics/saved-views')
      showToast('success', 'View saved')
    } catch {
      showToast('error', 'Failed to save view')
    }
  }, [postWorkspaceAction, showToast])

  const handleExport = useCallback(async () => {
    try {
      await postWorkspaceAction('/api/dashboard/analytics/exports')
      showToast('success', 'Export started — check your downloads')
    } catch {
      showToast('error', 'Export failed')
    }
  }, [postWorkspaceAction, showToast])

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    try {
      await onRefresh()
      showToast('success', 'Data refreshed')
    } catch {
      showToast('error', 'Refresh failed')
    }
  }, [onRefresh, showToast])

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium',
            toast.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          )}
        >
          {toast.message}
        </div>
      )}

      <Card className={workspaceThemeTokens.surface.shellCard}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <WorkspaceToolbar
              title={title}
              description={description}
              onSaveView={handleSaveView}
              onExport={handleExport}
            />
            {onRefresh && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || isFetching}
                className="border-white/10 bg-black/20 text-zinc-200 hover:bg-black/30"
              >
                {isRefreshing || isFetching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : (
            <WorkspaceKpiStrip items={kpis} />
          )}
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
