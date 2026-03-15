import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getFirecrawlTools: vi.fn(),
  getJinaTools: vi.fn(),
  searchWithPerplexity: vi.fn(),
}))

vi.mock('@/lib/mcp/firecrawl-client', () => ({
  getFirecrawlTools: mocks.getFirecrawlTools,
}))

vi.mock('@/lib/mcp/jina-client', () => ({
  getJinaTools: mocks.getJinaTools,
}))

vi.mock('@/lib/external-apis/perplexity', () => ({
  searchWithPerplexity: mocks.searchWithPerplexity,
}))

import { runEnrichment } from '@/lib/dashboard/analytics/enrichment-service'

describe('runEnrichment', () => {
  it('returns partial enrichment when one provider fails', async () => {
    mocks.getFirecrawlTools.mockRejectedValueOnce(new Error('down'))
    mocks.getJinaTools.mockResolvedValueOnce({ read_url: {} })
    mocks.searchWithPerplexity.mockResolvedValueOnce({
      success: true,
      answer: 'ok',
      citations: [{ url: 'https://example.com' }],
    })

    const result = await runEnrichment({
      domain: 'example.com',
      query: 'ai visibility',
    })

    expect(result.partial).toBe(true)
    expect(result.evidence.length).toBe(3)
    expect(result.evidence.some((item) => item.provider === 'firecrawl' && item.status === 'failed')).toBe(true)
  })
})
