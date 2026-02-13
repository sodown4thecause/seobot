import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(async (text: string) => {
    // very small deterministic vectors for tests:
    if (text.includes('query:seo')) return [1, 0, 0]
    if (text.includes('tool_name: serp_organic_live_advanced')) return [0.9, 0.1, 0]
    if (text.includes('tool_name: keywords_data_google_ads_search_volume')) return [0.8, 0.2, 0]
    if (text.includes('tool_name: firecrawl_scrape')) return [0.1, 0.9, 0]
    return [0, 0, 1]
  }),
}))

import type { Tool } from 'ai'
import { selectToolsByEmbedding } from '@/lib/ai/tool-selector'

function stubTool(description: string): Tool {
  return {
    type: 'dynamic',
    description,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async () => ({}) as any,
  } as unknown as Tool
}

describe('selectToolsByEmbedding', () => {
  it('selects the most similar tools, keeping pinned', async () => {
    const tools: Record<string, Tool> = {
      serp_organic_live_advanced: stubTool('SERP results'),
      keywords_data_google_ads_search_volume: stubTool('Search volume'),
      firecrawl_scrape: stubTool('Scrape URL'),
      unrelated_tool: stubTool('Unrelated'),
    }

    const { selectedTools } = await selectToolsByEmbedding({
      query: 'query:seo',
      tools,
      topK: 2,
      pinnedToolNames: ['firecrawl_scrape'],
      minSimilarity: 0.2,
    })

    expect(Object.keys(selectedTools)).toContain('firecrawl_scrape')
    expect(Object.keys(selectedTools)).toContain('serp_organic_live_advanced')
    expect(Object.keys(selectedTools)).not.toContain('unrelated_tool')
  })
})

