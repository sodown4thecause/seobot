'use client'

import { WorkspaceShell, type WorkspaceActionItem, type WorkspaceHistoryItem, type WorkspaceKpiItem, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-shell'
import { CONTENT_PERFORMANCE_MODULE_ORDER, ContentPerformanceModuleRegistry } from '@/components/dashboard/content-performance/module-registry'

const KPI_ITEMS: WorkspaceKpiItem[] = [
  { id: 'roi-index', label: 'Content ROI Index', value: '74.2', detail: 'vs 68.5 prior period' },
  { id: 'top-page-coverage', label: 'Top Page Coverage', value: '61%', detail: '48 pages above target' },
  { id: 'decay-pages', label: 'Decay Pages', value: '17', detail: 'need refresh in next 14 days' },
  { id: 'rewrite-priority', label: 'Rewrite Priority', value: '12', detail: 'high-impact briefs queued' },
]

const ACTION_QUEUE: WorkspaceActionItem[] = [
  { id: 'cp-a1', title: 'Generate rewrite brief: pricing page', status: 'in_progress', owner: 'content-bot' },
  { id: 'cp-a2', title: 'Track query cluster: ai seo reporting', status: 'pending', owner: 'seo-ops' },
]

const HISTORY: WorkspaceHistoryItem[] = [
  { id: 'cp-h1', label: 'Snapshot refreshed', timestamp: '2026-03-01 11:42 UTC', detail: 'DataForSEO baseline + enrichment merge' },
  { id: 'cp-h2', label: 'Brief generated', timestamp: '2026-03-01 10:18 UTC', detail: 'Cannibalization remediation batch' },
]

const TABS: WorkspaceTabItem[] = [
  {
    id: 'content-roi',
    label: 'Content ROI',
    content: <ContentPerformanceModuleRegistry moduleIds={CONTENT_PERFORMANCE_MODULE_ORDER.slice(0, 2)} />,
  },
  {
    id: 'serp-opportunities',
    label: 'SERP Opportunities',
    content: <ContentPerformanceModuleRegistry moduleIds={CONTENT_PERFORMANCE_MODULE_ORDER.slice(2, 6)} />,
  },
  {
    id: 'priority-queue',
    label: 'Priority Queue',
    content: <ContentPerformanceModuleRegistry moduleIds={CONTENT_PERFORMANCE_MODULE_ORDER.slice(6)} />,
  },
]

export function ContentPerformanceWorkspace() {
  return (
    <WorkspaceShell
      workspace="content-performance"
      title="Content Performance"
      description="Measure content impact, detect decay, and launch high-priority optimization loops."
      kpis={KPI_ITEMS}
      tabs={TABS}
      defaultTab="content-roi"
      actionQueue={ACTION_QUEUE}
      history={HISTORY}
    />
  )
}
