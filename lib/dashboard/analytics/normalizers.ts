import { buildWorkspaceSnapshot, type WorkspaceSnapshot } from '@/lib/dashboard/analytics/contracts'

export function normalizeContentPerformanceSnapshot(input: {
  rankedKeywordCount: number
  decayPages: number
}): WorkspaceSnapshot {
  const snapshot = buildWorkspaceSnapshot('content-performance')

  return {
    ...snapshot,
    kpis: [
      { id: 'content-roi', label: 'Content ROI Index', value: String(Math.min(100, 45 + Math.round(input.rankedKeywordCount / 5))) },
      { id: 'decay-pages', label: 'Decay Pages', value: String(input.decayPages) },
      { id: 'topic-gap', label: 'Topic Gap', value: String(Math.max(0, 40 - Math.round(input.rankedKeywordCount / 10))) },
      { id: 'rewrite-queue', label: 'Rewrite Queue', value: String(Math.max(0, input.decayPages - 2)) },
    ],
    modules: snapshot.modules.map((module) => ({ ...module, status: 'ready' })),
  }
}

export function normalizeAeoInsightsSnapshot(input: {
  aiKeywordCount: number
  citationCoverageScore: number
}): WorkspaceSnapshot {
  const snapshot = buildWorkspaceSnapshot('aeo-insights')

  return {
    ...snapshot,
    kpis: [
      { id: 'llm-visibility', label: 'LLM Visibility Score', value: String(Math.min(100, 30 + input.aiKeywordCount)) },
      { id: 'citation-share', label: 'Citation Share of Voice', value: `${Math.min(100, input.citationCoverageScore)}%` },
      { id: 'entity-gap', label: 'Entity Gap', value: String(Math.max(0, 25 - Math.round(input.aiKeywordCount / 2))) },
      { id: 'fix-queue', label: 'Fix Queue', value: String(Math.max(0, 18 - Math.round(input.citationCoverageScore / 10))) },
    ],
    modules: snapshot.modules.map((module) => ({ ...module, status: 'ready' })),
  }
}
