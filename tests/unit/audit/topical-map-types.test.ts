import { describe, expect, it } from 'vitest'
import type { TopicalMapNode, TopicalMapResultPayload } from '@/lib/audit/types'

describe('topical map types', () => {
  it('supports required node fields', () => {
    const node: TopicalMapNode = {
      topic: 'technical seo audit',
      intent: 'informational',
      youCoverage: 40,
      competitorCoverage: 72,
      aiMentions: 2,
      citations: 1,
      evidenceDepth: 20,
      freshness: { lastIndexedAt: '2026-02-25T00:00:00.000Z' },
      sourceUrls: ['https://example.com/source'],
      confidence: 0.85,
    }

    const payload: TopicalMapResultPayload = {
      auditVersion: '2026.02.topical-map.v1',
      publicVisibility: 'unlisted',
      topicalMap: {
        nodes: [node],
        scores: {
          topicalAuthority: 60,
          aeoCitation: 58,
          proofGap: 66,
          shareShock: 50,
        },
      },
      priorityActions: ['Improve technical seo audit with cited proof assets and source-backed comparisons.'],
      shareArtifacts: {
        verdictCard: { title: 'Topical Authority Snapshot', summary: 'summary' },
        topicalMapCard: { topGaps: ['technical seo audit'] },
        channels: { x: 'x', reddit: 'reddit' },
      },
      runMetadata: {
        generatedAt: '2026-02-25T00:00:00.000Z',
        confidence: 0.85,
        partialData: false,
        providerStatus: {
          dataforseo: 'ok',
          firecrawl: 'ok',
          aiDiagnostics: 'ok',
        },
      },
    }

    expect(payload.topicalMap.nodes[0].topic).toBe('technical seo audit')
  })
})
