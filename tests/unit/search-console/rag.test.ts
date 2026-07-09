import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildSearchConsoleRagMarkdown,
  ingestSearchConsoleSnapshot,
} from '@/lib/search-console/rag'

const mocks = vi.hoisted(() => ({
  ingestRagDocument: vi.fn(),
}))

vi.mock('@/lib/rag/ingest', () => ({
  ingestRagDocument: mocks.ingestRagDocument,
}))

describe('Search Console RAG helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds a compact Search Console summary with opportunity labels', () => {
    const markdown = buildSearchConsoleRagMarkdown({
      userId: 'user-1',
      siteUrl: 'https://flowintent.com',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      rows: [
        {
          query: 'ai seo tools',
          page: 'https://flowintent.com/ai-seo',
          clicks: 10,
          impressions: 1000,
          ctr: 0.01,
          position: 8,
        },
        {
          query: 'flowintent',
          clicks: 20,
          impressions: 100,
          ctr: 0.2,
          position: 1.2,
        },
      ],
    })

    expect(markdown).toContain('Search Console Snapshot')
    expect(markdown).toContain('Total clicks: 30')
    expect(markdown).toContain('ai seo tools: high-impression low-CTR ranking opportunity')
    expect(markdown).toContain('flowintent')
  })

  it('ingests Search Console snapshots as user-scoped SEO RAG', async () => {
    mocks.ingestRagDocument.mockResolvedValue({ documentIds: ['doc-1'], chunkCount: 1 })

    const result = await ingestSearchConsoleSnapshot({
      userId: 'user-1',
      siteUrl: 'https://flowintent.com',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      rows: [{
        query: 'ai seo tools',
        clicks: 10,
        impressions: 1000,
        ctr: 0.01,
        position: 8,
      }],
    })

    expect(result).toEqual({ documentIds: ['doc-1'], chunkCount: 1 })
    expect(mocks.ingestRagDocument).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'seo',
      sourceType: 'search_console',
      userId: 'user-1',
      url: 'https://flowintent.com',
      metadata: expect.objectContaining({
        siteUrl: 'https://flowintent.com',
        rowCount: 1,
      }),
    }))
  })
})
