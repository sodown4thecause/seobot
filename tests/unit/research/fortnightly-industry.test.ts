import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('@/lib/external-apis/perplexity', () => ({
  searchWithPerplexity: vi.fn(),
}))

vi.mock('@/lib/research/generate-summary', () => ({
  generateResearchSummary: vi.fn(async () => ({
    summary: '# Fortnightly digest\n\n## Evidence\n\nA cited insight.',
    model: 'test/model',
    rawJson: { usage: { totalTokens: 100 } },
  })),
}))

vi.mock('@/lib/rag/ingest', () => ({
  ingestRagDocument: vi.fn(async () => ({ documentIds: ['doc-1'], chunkCount: 1 })),
}))

vi.mock('@/lib/usage/spend-gate', () => ({
  checkSpendGate: vi.fn(async () => ({ allowed: true })),
}))

import {
  runFortnightlyIndustryResearch,
  runFortnightlyIndustryResearchForMode,
} from '@/lib/research/fortnightly-industry'
import { searchWithPerplexity } from '@/lib/external-apis/perplexity'
import { generateResearchSummary } from '@/lib/research/generate-summary'
import { ingestRagDocument } from '@/lib/rag/ingest'

describe('fortnightly industry research', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
      headers: new Map(),
    })))
    ;(searchWithPerplexity as Mock).mockResolvedValue({
      success: true,
      answer: 'Recent AI Overviews study found source overlap shifts.',
      citations: [
        { url: 'https://example.com/study', title: 'Study', domain: 'example.com' },
      ],
    })
  })

  it('fans out Perplexity research and ingests structure-aware mode RAG', async () => {
    const result = await runFortnightlyIndustryResearchForMode('geo')

    expect(result.status).toBe('complete')
    expect(result.mode).toBe('geo')
    expect(result.chunkCount).toBe(1)
    expect(searchWithPerplexity).toHaveBeenCalledTimes(2)
    expect(searchWithPerplexity).toHaveBeenCalledWith(expect.objectContaining({
      model: 'sonar-pro',
      searchRecencyFilter: 'month',
      returnCitations: true,
    }))
    expect(generateResearchSummary).toHaveBeenCalledWith(
      expect.stringContaining('Perplexity research packets'),
      'fortnightly-geo-industry-research'
    )
    expect(ingestRagDocument).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'geo',
      sourceType: 'fortnightly_industry_research',
      chunking: expect.objectContaining({ strategy: 'markdown-section' }),
      metadata: expect.objectContaining({
        cadence: 'fortnightly',
        sourceProvider: 'perplexity',
        sourceCount: 1,
      }),
    }))
  })

  it('returns a failed result when every source packet fails', async () => {
    ;(searchWithPerplexity as Mock).mockResolvedValue({
      success: false,
      answer: '',
      citations: [],
      error: 'Perplexity unavailable',
    })

    const result = await runFortnightlyIndustryResearchForMode('seo')

    expect(result.status).toBe('failed')
    expect(result.error).toContain('No successful Perplexity research packets')
    expect(ingestRagDocument).not.toHaveBeenCalled()
  })

  it('runs selected modes only', async () => {
    const results = await runFortnightlyIndustryResearch(['seo', 'social'], 'test-user-id')

    expect(results.map(result => result.mode).sort()).toEqual(['seo', 'social'])
    expect(results.every(result => result.status === 'complete')).toBe(true)
    expect(searchWithPerplexity).toHaveBeenCalledTimes(4)
  })
})
