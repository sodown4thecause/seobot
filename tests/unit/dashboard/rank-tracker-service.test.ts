import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  rankedKeywordsExecute,
  serpOrganicExecute,
  historicalOverviewExecute,
  historicalSerpExecute,
  firecrawlMapExecute,
  firecrawlScrapeExecute,
  firecrawlAgentExecute,
  jinaReadUrlExecute,
  jinaSnapshotExecute,
  searchWithPerplexityMock,
} = vi.hoisted(() => ({
  rankedKeywordsExecute: vi.fn(),
  serpOrganicExecute: vi.fn(),
  historicalOverviewExecute: vi.fn(),
  historicalSerpExecute: vi.fn(),
  firecrawlMapExecute: vi.fn(),
  firecrawlScrapeExecute: vi.fn(),
  firecrawlAgentExecute: vi.fn(),
  jinaReadUrlExecute: vi.fn(),
  jinaSnapshotExecute: vi.fn(),
  searchWithPerplexityMock: vi.fn(),
}))

vi.mock('@/lib/mcp/dataforseo', () => ({
  mcpDataforseoTools: {
    dataforseo_labs_google_ranked_keywords: { execute: rankedKeywordsExecute },
    serp_organic_live_advanced: { execute: serpOrganicExecute },
    dataforseo_labs_google_historical_rank_overview: { execute: historicalOverviewExecute },
    dataforseo_labs_google_historical_serp: { execute: historicalSerpExecute },
  },
}))

vi.mock('@/lib/mcp/firecrawl', () => ({
  mcpFirecrawlTools: {
    firecrawl_map: { execute: firecrawlMapExecute },
    firecrawl_scrape: { execute: firecrawlScrapeExecute },
    firecrawl_agent: { execute: firecrawlAgentExecute },
  },
}))

vi.mock('@/lib/mcp/jina', () => ({
  mcpJinaTools: {
    read_url: { execute: jinaReadUrlExecute },
    capture_screenshot_url: { execute: jinaSnapshotExecute },
  },
}))

vi.mock('@/lib/external-apis/perplexity', () => ({
  searchWithPerplexity: searchWithPerplexityMock,
}))

import { runRankTracker } from '@/lib/dashboard/rank-tracker/service'

function buildRankedKeywordsPayload() {
  return JSON.stringify({
    tasks: [
      {
        result: [
          {
            items: [
              {
                keyword_data: { keyword: 'local seo agency' },
                ranked_serp_element: { serp_item: { rank_group: 3, previous_rank_group: 8 } },
              },
              {
                keyword_data: { keyword: 'seo audit checklist' },
                ranked_serp_element: { serp_item: { rank_group: 14, previous_rank_group: 6 } },
              },
            ],
          },
        ],
      },
    ],
  })
}

function mockHappyPath() {
  rankedKeywordsExecute.mockResolvedValue(buildRankedKeywordsPayload())
  serpOrganicExecute.mockResolvedValue('{"tasks":[{"result":[{"items":[]}]}]}')
  historicalOverviewExecute.mockResolvedValue('{"tasks":[{"result":[{"items":[]}]}]}')
  historicalSerpExecute.mockResolvedValue('{"tasks":[{"result":[{"items":[]}]}]}')

  firecrawlMapExecute.mockResolvedValue(JSON.stringify(['https://example.com', 'https://example.com/blog']))
  firecrawlScrapeExecute.mockResolvedValue('ok')
  firecrawlAgentExecute.mockResolvedValue('ok')

  jinaReadUrlExecute.mockResolvedValue('ok')
  jinaSnapshotExecute.mockResolvedValue('ok')

  searchWithPerplexityMock.mockResolvedValue({
    success: true,
    answer: 'Top opportunities identified.',
    citations: [],
  })
}

describe('runRankTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns normalized success payload with summary and winners/losers', async () => {
    mockHappyPath()

    const result = await runRankTracker({
      domain: 'example.com',
      userId: 'user-1',
      competitors: ['competitor-one.com'],
      keywordLimit: 20,
      locationName: 'United States',
    })

    expect(result.summary.trackedKeywords).toBe(2)
    expect(result.movements.winners.count).toBe(1)
    expect(result.movements.losers.count).toBe(1)
    expect(result.providerStatus.providers.dataforseo).toBe('ok')
    expect(result.providerStatus.providers.googleSearchConsole).toBe('ok')
    expect(result.providerStatus.overall).toBe('ok')

    expect(rankedKeywordsExecute).toHaveBeenCalledWith(
      {
        target: 'example.com',
        location_name: 'United States',
        language_code: 'en',
        limit: 20,
        include_subdomains: false,
      },
      expect.objectContaining({ toolCallId: 'rank-tracker-dfs-ranked-keywords-user-1' })
    )
    expect(firecrawlMapExecute).toHaveBeenCalledWith(
      {
        url: 'https://example.com',
        limit: 6,
        includeSubdomains: false,
      },
      expect.objectContaining({ toolCallId: 'rank-tracker-firecrawl-map-user-1' })
    )
    expect(jinaReadUrlExecute).toHaveBeenCalledWith(
      { url: 'https://example.com', withAllLinks: true },
      expect.objectContaining({ toolCallId: 'rank-tracker-jina-read-user-1' })
    )
    expect(searchWithPerplexityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('example.com'),
        searchRecencyFilter: 'month',
        returnCitations: true,
      })
    )
  })

  it('returns payload with failed dataforseo status when ranked keywords provider fails', async () => {
    mockHappyPath()
    rankedKeywordsExecute.mockRejectedValue(new Error('DataForSEO unavailable'))

    const result = await runRankTracker({
      domain: 'example.com',
      userId: 'user-2',
    })

    expect(result.summary).toBeDefined()
    expect(result.providerStatus.providers.dataforseo).toBe('failed')
    expect(result.providerStatus.overall).toBe('partial')
    expect(result.keywords).toEqual([])
    expect(serpOrganicExecute).not.toHaveBeenCalled()
    expect(historicalOverviewExecute).not.toHaveBeenCalled()
    expect(historicalSerpExecute).not.toHaveBeenCalled()
  })

  it('returns failed payload and skips all provider calls for invalid domain input', async () => {
    mockHappyPath()

    const result = await runRankTracker({
      domain: 'not-a-domain',
      userId: 'user-invalid',
    })

    expect(result.providerStatus.providers.dataforseo).toBe('failed')
    expect(result.providerStatus.providers.googleSearchConsole).toBe('failed')
    expect(result.providerStatus.overall).toBe('failed')
    expect(result.keywords).toEqual([])

    expect(rankedKeywordsExecute).not.toHaveBeenCalled()
    expect(serpOrganicExecute).not.toHaveBeenCalled()
    expect(historicalOverviewExecute).not.toHaveBeenCalled()
    expect(historicalSerpExecute).not.toHaveBeenCalled()
    expect(firecrawlMapExecute).not.toHaveBeenCalled()
    expect(firecrawlScrapeExecute).not.toHaveBeenCalled()
    expect(firecrawlAgentExecute).not.toHaveBeenCalled()
    expect(jinaReadUrlExecute).not.toHaveBeenCalled()
    expect(jinaSnapshotExecute).not.toHaveBeenCalled()
    expect(searchWithPerplexityMock).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: 'firecrawl fails',
      setupFailure: () => {
        firecrawlMapExecute.mockRejectedValue(new Error('firecrawl map failed'))
      },
    },
    {
      label: 'jina read fails',
      setupFailure: () => {
        jinaReadUrlExecute.mockRejectedValue(new Error('jina read failed'))
      },
    },
    {
      label: 'perplexity fails',
      setupFailure: () => {
        searchWithPerplexityMock.mockRejectedValue(new Error('perplexity failed'))
      },
    },
  ])('degrades secondary provider status to partial when $label independently', async ({ setupFailure }) => {
    mockHappyPath()
    setupFailure()

    const result = await runRankTracker({
      domain: 'example.com',
      userId: 'user-secondary',
    })

    expect(result.providerStatus.providers.dataforseo).toBe('ok')
    expect(result.providerStatus.providers.googleSearchConsole).toBe('partial')
    expect(result.providerStatus.overall).toBe('partial')
  })

  it('marks secondary provider as partial when Jina screenshot capture fails', async () => {
    mockHappyPath()
    jinaSnapshotExecute.mockRejectedValue(new Error('screenshot failed'))

    const result = await runRankTracker({
      domain: 'example.com',
      userId: 'user-jina-screenshot',
    })

    expect(jinaReadUrlExecute).toHaveBeenCalledTimes(1)
    expect(jinaSnapshotExecute).toHaveBeenCalledTimes(1)
    expect(result.providerStatus.providers.googleSearchConsole).toBe('partial')
    expect(result.providerStatus.overall).toBe('partial')
  })

  it('remains resilient when Perplexity returns success=false', async () => {
    mockHappyPath()
    searchWithPerplexityMock.mockResolvedValue({
      success: false,
      error: 'Perplexity API temporary issue',
    })

    const result = await runRankTracker({
      domain: 'example.com',
      userId: 'user-perplexity-false',
    })

    expect(result.providerStatus.providers.dataforseo).toBe('ok')
    expect(result.providerStatus.providers.googleSearchConsole).toBe('partial')
    expect(result.providerStatus.overall).toBe('partial')
  })

  it('uses defaults and clamps limits for provider tool inputs', async () => {
    mockHappyPath()

    await runRankTracker({
      domain: 'example.com',
      userId: 'user-default-limits',
    })

    expect(rankedKeywordsExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 25,
      }),
      expect.anything()
    )
    expect(serpOrganicExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 20,
      }),
      expect.anything()
    )
    expect(firecrawlMapExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 6,
      }),
      expect.anything()
    )

    vi.clearAllMocks()
    mockHappyPath()

    await runRankTracker({
      domain: 'example.com',
      userId: 'user-clamped-limits',
      keywordLimit: 500,
      serpDepth: 2,
      firecrawlLimit: 999,
    })

    expect(rankedKeywordsExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100,
      }),
      expect.anything()
    )
    expect(serpOrganicExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 10,
      }),
      expect.anything()
    )
    expect(firecrawlMapExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
      }),
      expect.anything()
    )
  })
})
