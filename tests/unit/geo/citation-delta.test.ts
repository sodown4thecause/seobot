import { describe, expect, it } from 'vitest'
import { computeCitationDelta } from '@/lib/geo/citation-delta'

const run = (overrides: Partial<Parameters<typeof computeCitationDelta>[0][number]> = {}) => ({
  engine: 'chatgpt',
  status: 'completed',
  sentiment: 'negative',
  brandPosition: null,
  citedUrls: ['https://example.com/old'],
  citedDomains: ['example.com'],
  mentionedBrands: [],
  brand: 'FlowIntent',
  capturedAt: '2026-07-24T00:00:00.000Z',
  ...overrides,
})

describe('computeCitationDelta', () => {
  it('detects mention-rate improvement and unions double probes', () => {
    const baseline = [run()]
    const verification = [
      run({ mentionedBrands: ['FlowIntent'], sentiment: 'neutral', citedUrls: ['https://new.example/page'], citedDomains: ['new.example'] }),
      run({ mentionedBrands: [], sentiment: 'negative', citedUrls: [], citedDomains: [] }),
    ]

    const delta = computeCitationDelta(baseline, verification)

    expect(delta.mentionRateBefore).toBe(0)
    expect(delta.mentionRateAfter).toBe(1)
    expect(delta.verdict).toBe('improved')
    expect(delta.newCitations).toEqual(['new.example'])
  })

  it('detects a shipped URL or domain citation as improvement', () => {
    const baseline = [run({ sentiment: 'neutral' })]
    const verification = [run({ citedUrls: ['https://flowintent.com/proof'], citedDomains: ['flowintent.com'], sentiment: 'neutral' })]

    expect(computeCitationDelta(baseline, verification, 'https://flowintent.com/proof').verdict).toBe('improved')
  })

  it('detects negative-to-neutral sentiment improvement', () => {
    const baseline = [run({ sentiment: 'negative' })]
    const verification = [run({ sentiment: 'neutral' })]

    expect(computeCitationDelta(baseline, verification).verdict).toBe('improved')
  })

  it('detects mention-rate regression and ignores failed probes', () => {
    const baseline = [
      run({ engine: 'chatgpt', mentionedBrands: ['FlowIntent'], brandPosition: 1 }),
      run({ engine: 'perplexity', mentionedBrands: ['FlowIntent'], brandPosition: 1 }),
    ]
    const verification = [
      run({ engine: 'chatgpt', mentionedBrands: [], brandPosition: null }),
      run({ engine: 'perplexity', status: 'error', mentionedBrands: [], brandPosition: null }),
    ]

    const delta = computeCitationDelta(baseline, verification)

    expect(delta.perEngine).toHaveLength(1)
    expect(delta.verdict).toBe('regressed')
  })

  it('returns no_change when successful engines do not move', () => {
    const baseline = [run({ sentiment: 'neutral', mentionedBrands: ['FlowIntent'], brandPosition: 1 })]
    const verification = [run({ sentiment: 'neutral', mentionedBrands: ['FlowIntent'], brandPosition: 1 })]

    expect(computeCitationDelta(baseline, verification).verdict).toBe('no_change')
  })
})
