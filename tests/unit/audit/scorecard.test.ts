import { describe, expect, it } from 'vitest'
import { buildAuditScorecard } from '@/lib/audit/scorecard'
import type { AuditResults, PlatformResult, TopicalMapResultPayload } from '@/lib/audit/types'

const results: AuditResults = {
  brand: 'Northstar',
  brandFoundCount: 1,
  totalChecks: 5,
  visibilityRate: 20,
  topCompetitor: 'Atlas',
  topCompetitorFoundCount: 4,
  competitorAdvantage:
    'Northstar appeared 1 out of 5 times in this sample, while Atlas appeared 4 times. That gives you a clear benchmark and visible room to grow.',
  citationUrls: ['https://atlas.com/compare'],
  userDomainCited: false,
  competitorDomainsCited: [{ domain: 'atlas.com', count: 1 }],
  platformResults: {
    perplexity: [
      { mentioned: false, position: null },
      { mentioned: false, position: null },
      { mentioned: true, position: 3 },
    ],
    grok: { mentioned: false, position: null },
    gemini: { mentioned: false, position: null },
  },
}

const platformResults: PlatformResult[] = [
  {
    platform: 'perplexity',
    prompt: 'best ai seo tools',
    brandMentioned: false,
    brandPosition: null,
    brandContext: null,
    competitorsMentioned: ['Atlas'],
    citationUrls: ['https://atlas.com/compare'],
    userDomainCited: false,
    competitorDomainsCited: ['atlas.com'],
    rawResponse: 'Atlas leads the category.',
  },
  {
    platform: 'perplexity',
    prompt: 'aeo software for teams',
    brandMentioned: false,
    brandPosition: null,
    brandContext: null,
    competitorsMentioned: ['Atlas'],
    citationUrls: [],
    userDomainCited: false,
    competitorDomainsCited: [],
    rawResponse: 'Atlas and Orbit were surfaced.',
  },
  {
    platform: 'perplexity',
    prompt: 'northstar alternatives',
    brandMentioned: true,
    brandPosition: 3,
    brandContext: 'Northstar is mentioned as an emerging option.',
    competitorsMentioned: ['Atlas'],
    citationUrls: [],
    userDomainCited: false,
    competitorDomainsCited: [],
    rawResponse: 'Northstar is mentioned as an emerging option.',
  },
  {
    platform: 'grok',
    prompt: 'best ai seo tools',
    brandMentioned: false,
    brandPosition: null,
    brandContext: null,
    competitorsMentioned: ['Atlas'],
    citationUrls: [],
    userDomainCited: false,
    competitorDomainsCited: [],
    rawResponse: 'Atlas remains the preferred option.',
  },
  {
    platform: 'gemini',
    prompt: 'best ai seo tools',
    brandMentioned: false,
    brandPosition: null,
    brandContext: null,
    competitorsMentioned: ['Atlas'],
    citationUrls: [],
    userDomainCited: false,
    competitorDomainsCited: [],
    rawResponse: 'Atlas is the strongest recommendation.',
  },
]

const topicalMapPayload: TopicalMapResultPayload = {
  auditVersion: '2026.02.topical-map.v1',
  publicVisibility: 'unlisted',
  topicalMap: {
    scores: {
      topicalAuthority: 38,
      aeoCitation: 29,
      proofGap: 76,
      shareShock: 59,
    },
    nodes: [
      {
        topic: 'ai visibility scoring',
        intent: 'commercial',
        youCoverage: 22,
        competitorCoverage: 71,
        aiMentions: 1,
        citations: 0,
        evidenceDepth: 35,
        freshness: { lastIndexedAt: '2026-02-25T00:00:00.000Z' },
        sourceUrls: ['https://northstar.com/ai-visibility'],
        confidence: 0.78,
      },
    ],
  },
  priorityActions: ['Build source-backed coverage around ai visibility scoring to strengthen visibility, citations, and buying-intent trust.'],
  shareArtifacts: {
    verdictCard: { title: 'Topical Opportunity Snapshot', summary: 'Test summary' },
    topicalMapCard: { topGaps: ['ai visibility scoring'] },
    channels: { x: 'x post', reddit: 'reddit post' },
  },
  runMetadata: {
    generatedAt: '2026-02-25T00:00:00.000Z',
    confidence: 0.78,
    partialData: false,
    providerStatus: {
      dataforseo: 'ok',
      firecrawl: 'ok',
      aiDiagnostics: 'ok',
    },
  },
}

describe('buildAuditScorecard', () => {
  it('turns a low-visibility result into a positive scorecard with actions', () => {
    const scorecard = buildAuditScorecard({
      results,
      platformResults,
      topicalMapPayload,
      executionMeta: { fallbackApplied: false, citationAvailability: 'full' },
    })

    expect(scorecard.momentumCategory.label).toBe('Untapped Upside')
    expect(scorecard.fastestWin.timeframe).toBe('7 days')
    expect(scorecard.strengths.length).toBeGreaterThan(0)
    expect(scorecard.opportunities.length).toBeGreaterThan(0)
    expect(scorecard.actionPlan.next30Days.length).toBeGreaterThan(0)
    expect(scorecard.shareModules.some((module) => module.format === 'linkedin')).toBe(true)
    expect(scorecard.teamSummary.summary.toLowerCase()).not.toContain('invisible')
  })
})
