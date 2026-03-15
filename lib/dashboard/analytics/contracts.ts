export type WorkspaceKey = 'content-performance' | 'aeo-insights'

export type WorkspaceSnapshot = {
  workspace: WorkspaceKey
  generatedAt: string
  kpis: Array<{
    id: string
    label: string
    value: string
    detail?: string
  }>
  modules: Array<{
    id: string
    title: string
    status: 'ready' | 'pending'
  }>
}

const WORKSPACE_BASELINES: Record<WorkspaceKey, Omit<WorkspaceSnapshot, 'generatedAt'>> = {
  'content-performance': {
    workspace: 'content-performance',
    kpis: [
      { id: 'content-roi', label: 'Content ROI Index', value: '--' },
      { id: 'decay-pages', label: 'Decay Pages', value: '--' },
      { id: 'topic-gap', label: 'Topic Gap', value: '--' },
      { id: 'rewrite-queue', label: 'Rewrite Queue', value: '--' },
    ],
    modules: [
      { id: 'content-roi', title: 'Content ROI', status: 'pending' },
      { id: 'serp-opportunities', title: 'SERP Opportunities', status: 'pending' },
      { id: 'priority-queue', title: 'Priority Queue', status: 'pending' },
    ],
  },
  'aeo-insights': {
    workspace: 'aeo-insights',
    kpis: [
      { id: 'llm-visibility', label: 'LLM Visibility Score', value: '--' },
      { id: 'citation-share', label: 'Citation Share of Voice', value: '--' },
      { id: 'entity-gap', label: 'Entity Gap', value: '--' },
      { id: 'fix-queue', label: 'Fix Queue', value: '--' },
    ],
    modules: [
      { id: 'visibility', title: 'Visibility', status: 'pending' },
      { id: 'coverage-gaps', title: 'Coverage and Gaps', status: 'pending' },
      { id: 'competitive-diff', title: 'Competitive Diff', status: 'pending' },
    ],
  },
}

export function buildWorkspaceSnapshot(workspace: WorkspaceKey): WorkspaceSnapshot {
  return {
    ...WORKSPACE_BASELINES[workspace],
    generatedAt: new Date().toISOString(),
  }
}
