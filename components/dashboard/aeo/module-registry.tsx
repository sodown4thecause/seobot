'use client'

import { ModuleCard } from '@/components/dashboard/analytics/module-card'

export const AEO_MODULE_ORDER = [
  'llm-visibility-score',
  'citation-share-of-voice',
  'prompt-cluster-coverage',
  'entity-answer-gap',
  'ai-overview-presence',
  'query-intent-drift',
  'competitor-citation-diff',
  'aeo-fix-queue',
] as const

const MODULE_COPY: Record<(typeof AEO_MODULE_ORDER)[number], { title: string; description: string }> = {
  'llm-visibility-score': {
    title: 'LLM Visibility Score',
    description: 'Track answer engine exposure across key prompt clusters.',
  },
  'citation-share-of-voice': {
    title: 'Citation Share of Voice',
    description: 'Measure citation win-rate versus competitors by question set.',
  },
  'prompt-cluster-coverage': {
    title: 'Prompt Cluster Coverage',
    description: 'Audit which prompt groups are covered, weak, or missing.',
  },
  'entity-answer-gap': {
    title: 'Entity and Answer Gap',
    description: 'Find missing entities and weak answer structures in model outputs.',
  },
  'ai-overview-presence': {
    title: 'AI Overview Presence',
    description: 'Track inclusion frequency inside AI overview-style result blocks.',
  },
  'query-intent-drift': {
    title: 'Query Intent Drift',
    description: 'Detect intent shifts that can reduce citation and answer relevance.',
  },
  'competitor-citation-diff': {
    title: 'Competitor Citation Diff',
    description: 'Compare citation deltas and identify where competitors gained ground.',
  },
  'aeo-fix-queue': {
    title: 'AEO Fix Queue',
    description: 'Prioritize fixes by confidence, impact, and implementation effort.',
  },
}

interface AeoModuleRegistryProps {
  moduleIds: readonly string[]
  moduleStatuses?: Record<string, 'ready' | 'pending'>
}

export function AeoModuleRegistry({ moduleIds, moduleStatuses }: AeoModuleRegistryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {moduleIds
        .filter((moduleId): moduleId is (typeof AEO_MODULE_ORDER)[number] => moduleId in MODULE_COPY)
        .map((moduleId) => (
          <ModuleCard
            key={moduleId}
            title={MODULE_COPY[moduleId].title}
            description={MODULE_COPY[moduleId].description}
            status={moduleStatuses?.[moduleId]}
          />
        ))}
    </div>
  )
}
