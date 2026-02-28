import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { TopicalAuthorityMap } from '@/components/audit/TopicalAuthorityMap'
import type { TopicalMapResultPayload } from '@/lib/audit/types'

const payload: TopicalMapResultPayload = {
  auditVersion: '2026.02.topical-map.v1',
  publicVisibility: 'unlisted',
  topicalMap: {
    scores: {
      topicalAuthority: 63,
      aeoCitation: 58,
      proofGap: 72,
      shareShock: 49,
    },
    nodes: [
      {
        topic: 'technical seo audit',
        intent: 'informational',
        youCoverage: 46,
        competitorCoverage: 68,
        aiMentions: 2,
        citations: 1,
        evidenceDepth: 61,
        freshness: { lastIndexedAt: '2026-02-25T00:00:00.000Z' },
        sourceUrls: ['https://example.com/source'],
        confidence: 0.82,
      },
    ],
  },
  priorityActions: ['Improve technical seo audit with cited proof assets and source-backed comparisons.'],
  shareArtifacts: {
    verdictCard: { title: 'Topical Authority Snapshot', summary: 'Test summary' },
    topicalMapCard: { topGaps: ['technical seo audit'] },
    channels: { x: 'x post', reddit: 'reddit post' },
  },
  runMetadata: {
    generatedAt: '2026-02-25T00:00:00.000Z',
    confidence: 0.82,
    partialData: false,
    providerStatus: {
      dataforseo: 'ok',
      firecrawl: 'ok',
      aiDiagnostics: 'ok',
    },
  },
}

describe('TopicalAuthorityMap', () => {
  it('renders nodes and score cards', () => {
    const html = renderToStaticMarkup(createElement(TopicalAuthorityMap, { payload }))

    expect(html).toContain('Topical Authority')
    expect(html).toContain('AEO Citation')
    expect(html).toContain('technical seo audit')
    expect(html).toContain('Priority Actions')
  })
})
