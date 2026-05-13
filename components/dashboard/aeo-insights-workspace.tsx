'use client'

import { useMemo, useState } from 'react'
import { WorkspaceShell, type WorkspaceActionItem, type WorkspaceHistoryItem, type WorkspaceKpiItem, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-shell'
import { AEO_MODULE_ORDER, AeoModuleRegistry } from '@/components/dashboard/aeo/module-registry'
import { useAeoInsightsWorkspace } from '@/lib/dashboard/hooks/use-aeo-insights-workspace'

const DEFAULT_KEYWORDS = ['seo reporting', 'ai search visibility', 'answer engine optimization']

const ACTION_QUEUE: WorkspaceActionItem[] = [
  { id: 'aeo-a1', title: 'Generate AEO brief: buyer intent cluster', status: 'pending', owner: 'aeo-agent' },
  { id: 'aeo-a2', title: 'Track prompt set: ai seo platform pricing', status: 'in_progress', owner: 'research-ops' },
]

export function AeoInsightsWorkspace() {
  const [domain] = useState<string | undefined>(undefined)

  const { kpis, modules, isLoading, isFetching, isRefreshing, refresh } = useAeoInsightsWorkspace(
    { keywords: DEFAULT_KEYWORDS, domain }
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

  const history: WorkspaceHistoryItem[] = [
    { id: 'aeo-h1', label: 'Snapshot loaded', timestamp: new Date().toUTCString(), detail: 'Live data from DataForSEO AI analysis' },
  ]

  const tabs: WorkspaceTabItem[] = useMemo(
    () => [
      {
        id: 'visibility',
        label: 'Visibility',
        content: <AeoModuleRegistry moduleIds={AEO_MODULE_ORDER.slice(0, 2)} moduleStatuses={moduleStatuses} />,
      },
      {
        id: 'coverage-gaps',
        label: 'Coverage and Gaps',
        content: <AeoModuleRegistry moduleIds={AEO_MODULE_ORDER.slice(2, 6)} moduleStatuses={moduleStatuses} />,
      },
      {
        id: 'competitive-diff',
        label: 'Competitive Diff',
        content: <AeoModuleRegistry moduleIds={AEO_MODULE_ORDER.slice(6)} moduleStatuses={moduleStatuses} />,
      },
    ],
    [moduleStatuses]
  )

  return (
    <WorkspaceShell
      workspace="aeo-insights"
      title="AEO Insights"
      description="Monitor LLM visibility, citation share, and answer quality gaps with action-ready recommendations."
      kpis={liveKpis}
      tabs={tabs}
      defaultTab="visibility"
      actionQueue={ACTION_QUEUE}
      history={history}
      isLoading={isLoading}
      isFetching={isFetching}
      isRefreshing={isRefreshing}
      onRefresh={() => refresh({ promptCluster: DEFAULT_KEYWORDS.join(','), domain })}
    />
  )
}
