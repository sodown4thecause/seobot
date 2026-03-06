import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  analyzeAISearchVolume: vi.fn(),
  runEnrichment: vi.fn(),
}))

vi.mock('@/lib/services/dataforseo/ai-search-volume-integration', () => ({
  analyzeAISearchVolume: mocks.analyzeAISearchVolume,
}))

vi.mock('@/lib/dashboard/analytics/enrichment-service', () => ({
  runEnrichment: mocks.runEnrichment,
}))

import { buildAeoInsightsSnapshot } from '@/lib/dashboard/aeo/service'

describe('buildAeoInsightsSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.analyzeAISearchVolume.mockResolvedValue({
      success: true,
      data: {
        summary: {
          totalKeywords: 18,
          averageAIOpportunityScore: 62,
        },
      },
    })
    mocks.runEnrichment.mockResolvedValue({ partial: false, evidence: [] })
  })

  it('maps AI keyword signals into AEO workspace snapshot', async () => {
    const snapshot = await buildAeoInsightsSnapshot({
      keywords: ['seo platform', 'ai visibility'],
    })

    expect(snapshot.workspace).toBe('aeo-insights')
    expect(snapshot.kpis.find((kpi) => kpi.id === 'llm-visibility')).toBeDefined()
    expect(snapshot.modules.every((module) => module.status === 'ready')).toBe(true)
    expect(mocks.analyzeAISearchVolume).toHaveBeenCalledWith(
      expect.objectContaining({ keywords: ['seo platform', 'ai visibility'] })
    )
  })

  it('passes enrichment result to normalizer', async () => {
    const snapshot = await buildAeoInsightsSnapshot({
      keywords: ['seo platform'],
    })

    expect(mocks.runEnrichment).toHaveBeenCalledWith(
      expect.objectContaining({ domain: 'example.com', query: 'seo platform' })
    )
    expect(snapshot.modules.every((module) => module.status === 'ready')).toBe(true)
  })

  it('marks modules as pending when enrichment is partial', async () => {
    mocks.runEnrichment.mockResolvedValueOnce({
      partial: true,
      evidence: [
        { provider: 'firecrawl', status: 'failed', summary: 'Firecrawl MCP unavailable' },
        { provider: 'jina', status: 'ready', summary: 'Jina MCP connected (2 tools available)' },
        { provider: 'perplexity', status: 'ready', summary: 'Perplexity returned 3 citations' },
      ],
    })

    const snapshot = await buildAeoInsightsSnapshot({
      keywords: ['seo platform'],
    })

    expect(snapshot.modules.every((module) => module.status === 'pending')).toBe(true)
  })
})
