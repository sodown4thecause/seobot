import { describe, expect, it } from 'vitest'
import { buildTopicalMapPayload } from '@/lib/audit/topical-map-payload'

describe('topical map payload', () => {
  it('includes auditVersion and unlisted visibility by default', () => {
    const payload = buildTopicalMapPayload({
      nodes: [
        {
          topic: 'technical seo audit',
          intent: 'informational',
          youCoverage: 45,
          competitorCoverage: 69,
          aiMentions: 2,
          citations: 1,
          evidenceDepth: 60,
          freshness: { lastIndexedAt: '2026-02-25T00:00:00.000Z' },
          sourceUrls: ['https://flowintent.com/technical-seo-audit'],
          confidence: 0.82,
        },
      ],
    })

    expect(payload.auditVersion).toBeTruthy()
    expect(payload.publicVisibility).toBe('unlisted')
    expect(payload.topicalMap.scores.topicalAuthority).toBeTypeOf('number')
  })
})
