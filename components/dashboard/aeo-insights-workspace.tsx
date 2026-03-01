'use client'

import { WorkspaceShell, type WorkspaceActionItem, type WorkspaceHistoryItem, type WorkspaceKpiItem, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-shell'
import { AEO_MODULE_ORDER, AeoModuleRegistry } from '@/components/dashboard/aeo/module-registry'

const KPI_ITEMS: WorkspaceKpiItem[] = [
  { id: 'llm-visibility', label: 'LLM Visibility Score', value: '66', detail: 'up 6 points week over week' },
  { id: 'citation-sov', label: 'Citation Share of Voice', value: '23%', detail: 'across tracked prompt clusters' },
  { id: 'entity-gap', label: 'Entity Gap Count', value: '14', detail: 'priority entities missing in answers' },
  { id: 'fix-queue', label: 'AEO Fix Queue', value: '9', detail: 'high-confidence actions ready' },
]

const ACTION_QUEUE: WorkspaceActionItem[] = [
  { id: 'aeo-a1', title: 'Generate AEO brief: buyer intent cluster', status: 'pending', owner: 'aeo-agent' },
  { id: 'aeo-a2', title: 'Track prompt set: ai seo platform pricing', status: 'in_progress', owner: 'research-ops' },
]

const HISTORY: WorkspaceHistoryItem[] = [
  { id: 'aeo-h1', label: 'Citation diff processed', timestamp: '2026-03-01 11:50 UTC', detail: 'Competitor citation overlap updated' },
  { id: 'aeo-h2', label: 'Prompt coverage refreshed', timestamp: '2026-03-01 09:32 UTC', detail: '84 prompts analyzed in latest run' },
]

const TABS: WorkspaceTabItem[] = [
  {
    id: 'visibility',
    label: 'Visibility',
    content: <AeoModuleRegistry moduleIds={AEO_MODULE_ORDER.slice(0, 2)} />,
  },
  {
    id: 'coverage-gaps',
    label: 'Coverage and Gaps',
    content: <AeoModuleRegistry moduleIds={AEO_MODULE_ORDER.slice(2, 6)} />,
  },
  {
    id: 'competitive-diff',
    label: 'Competitive Diff',
    content: <AeoModuleRegistry moduleIds={AEO_MODULE_ORDER.slice(6)} />,
  },
]

export function AeoInsightsWorkspace() {
  return (
    <WorkspaceShell
      workspace="aeo-insights"
      title="AEO Insights"
      description="Monitor LLM visibility, citation share, and answer quality gaps with action-ready recommendations."
      kpis={KPI_ITEMS}
      tabs={TABS}
      defaultTab="visibility"
      actionQueue={ACTION_QUEUE}
      history={HISTORY}
    />
  )
}
