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
})
