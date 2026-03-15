'use client'

import { ModuleCard } from '@/components/dashboard/analytics/module-card'

export const CONTENT_PERFORMANCE_MODULE_ORDER = [
  'content-roi',
  'top-pages-decay',
  'topic-gap',
  'serp-feature-capture',
  'cannibalization',
  'internal-link-opportunity',
  'competitor-delta',
  'rewrite-priority-queue',
] as const

const MODULE_COPY: Record<(typeof CONTENT_PERFORMANCE_MODULE_ORDER)[number], { title: string; description: string }> = {
  'content-roi': {
    title: 'Content ROI',
    description: 'Track value generation, conversion alignment, and return by content cluster.',
  },
  'top-pages-decay': {
    title: 'Top Pages and Decay',
    description: 'Detect high-impact pages that are losing visibility and prioritize rescue actions.',
  },
  'topic-gap': {
    title: 'Topic Gap',
    description: 'Reveal missing topical coverage against direct SERP competitors.',
  },
  'serp-feature-capture': {
    title: 'SERP Feature Capture',
    description: 'Measure ownership of snippets, PAA entries, and rich feature placements.',
  },
  cannibalization: {
    title: 'Cannibalization',
    description: 'Identify competing URLs and map merge, canonical, or rewrite decisions.',
  },
  'internal-link-opportunity': {
    title: 'Internal Link Opportunity',
    description: 'Suggest source-target links to strengthen authority distribution.',
  },
  'competitor-delta': {
    title: 'Competitor Delta',
    description: 'Show where competitors gained or lost share versus your domain.',
  },
  'rewrite-priority-queue': {
    title: 'Rewrite Priority Queue',
    description: 'Queue and score rewrite actions by expected upside and implementation cost.',
  },
}

interface ContentPerformanceModuleRegistryProps {
  moduleIds: readonly string[]
}

export function ContentPerformanceModuleRegistry({ moduleIds }: ContentPerformanceModuleRegistryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {moduleIds
        .filter((moduleId): moduleId is (typeof CONTENT_PERFORMANCE_MODULE_ORDER)[number] => moduleId in MODULE_COPY)
        .map((moduleId) => (
          <ModuleCard
            key={moduleId}
            title={MODULE_COPY[moduleId].title}
            description={MODULE_COPY[moduleId].description}
          />
        ))}
    </div>
  )
}
