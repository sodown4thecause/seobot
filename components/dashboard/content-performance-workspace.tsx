'use client'

import { useMemo } from 'react'
import { WorkspaceShell, type WorkspaceActionItem, type WorkspaceHistoryItem, type WorkspaceKpiItem, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-shell'
import { CONTENT_PERFORMANCE_MODULE_ORDER, ContentPerformanceModuleRegistry } from '@/components/dashboard/content-performance/module-registry'
import { useContentPerformanceWorkspace } from '@/lib/dashboard/hooks/use-content-performance-workspace'

const ACTION_QUEUE: WorkspaceActionItem[] = [
  { id: 'cp-a1', title: 'Generate rewrite brief: pricing page', status: 'in_progress', owner: 'content-bot' },
  { id: 'cp-a2', title: 'Track query cluster: ai seo reporting', status: 'pending', owner: 'seo-ops' },
]

interface ContentPerformanceWorkspaceProps {
  domain?: string
}

export function ContentPerformanceWorkspace({ domain }: ContentPerformanceWorkspaceProps) {
  const { kpis, modules, isLoading, isFetching, isRefreshing, refresh } = useContentPerformanceWorkspace(
    domain ? { domain } : null
  )

  const moduleStatuses = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.id, m.status])) as Record<string, 'ready' | 'pending'>,
    [modules]
  )

  const liveKpis: WorkspaceKpiItem[] = useMemo(
    () =>
      kpis.map((kpi) => ({
        id: kpi.id,
        label: kpi.label,
        value: isLoading ? '--' : kpi.value,
        detail: kpi.detail,
      })),
    [kpis, isLoading]
  )

  const history: WorkspaceHistoryItem[] = useMemo(
    () => [
      {
        id: 'cp-h1',
        label: domain ? 'Snapshot loaded' : 'Enter domain to load',
        timestamp: new Date().toUTCString(),
        detail: domain
          ? 'Live data from DataForSEO ranked keywords analysis'
          : 'No domain configured — visit Website Audit to run a scan first',
      },
    ],
    [domain]
  )

  const tabs: WorkspaceTabItem[] = useMemo(
    () => [
      {
        id: 'content-roi',
        label: 'Content ROI',
        content: <ContentPerformanceModuleRegistry moduleIds={CONTENT_PERFORMANCE_MODULE_ORDER.slice(0, 2)} moduleStatuses={moduleStatuses} />,
      },
      {
        id: 'serp-opportunities',
        label: 'SERP Opportunities',
        content: <ContentPerformanceModuleRegistry moduleIds={CONTENT_PERFORMANCE_MODULE_ORDER.slice(2, 6)} moduleStatuses={moduleStatuses} />,
      },
      {
        id: 'priority-queue',
        label: 'Priority Queue',
        content: <ContentPerformanceModuleRegistry moduleIds={CONTENT_PERFORMANCE_MODULE_ORDER.slice(6)} moduleStatuses={moduleStatuses} />,
      },
    ],
    [moduleStatuses]
  )

  return (
    <WorkspaceShell
      workspace="content-performance"
      title="Content Performance"
      description="Measure content impact, detect decay, and launch high-priority optimization loops."
      kpis={liveKpis}
      tabs={tabs}
      defaultTab="content-roi"
      actionQueue={ACTION_QUEUE}
      history={history}
      isLoading={isLoading}
      isFetching={isFetching}
      isRefreshing={isRefreshing}
      onRefresh={domain ? () => refresh({ domain }) : undefined}
    />
  )
}
