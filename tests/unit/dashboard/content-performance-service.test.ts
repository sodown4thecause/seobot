import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  analyzeRankedKeywords: vi.fn(),
  runEnrichment: vi.fn(),
}))

vi.mock('@/lib/services/dataforseo/ranked-keywords-analysis', () => ({
  analyzeRankedKeywords: mocks.analyzeRankedKeywords,
}))

vi.mock('@/lib/dashboard/analytics/enrichment-service', () => ({
  runEnrichment: mocks.runEnrichment,
}))

import { buildContentPerformanceSnapshot } from '@/lib/dashboard/content-performance/service'

describe('buildContentPerformanceSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.analyzeRankedKeywords.mockResolvedValue({
      success: true,
      data: { totalKeywords: 50 },
    })
    mocks.runEnrichment.mockResolvedValue({ partial: false, evidence: [] })
  })

  it('maps DataForSEO keyword profile into workspace snapshot', async () => {
    const snapshot = await buildContentPerformanceSnapshot({
      domain: 'example.com',
    })

    expect(snapshot.workspace).toBe('content-performance')
    expect(snapshot.kpis.find((kpi) => kpi.id === 'content-roi')).toBeDefined()
    expect(snapshot.modules.every((module) => module.status === 'ready')).toBe(true)
    expect(mocks.analyzeRankedKeywords).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'example.com' })
    )
  })
})
