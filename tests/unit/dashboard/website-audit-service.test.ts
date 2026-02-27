import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  firecrawlMapExecute,
  firecrawlCrawlExecute,
  onPageInstantPagesExecute,
  onPageContentParsingExecute,
  onPageLighthouseExecute,
  jinaReadUrlExecute,
  jinaScreenshotExecute,
  searchWithPerplexityMock,
} = vi.hoisted(() => ({
  firecrawlMapExecute: vi.fn(),
  firecrawlCrawlExecute: vi.fn(),
  onPageInstantPagesExecute: vi.fn(),
  onPageContentParsingExecute: vi.fn(),
  onPageLighthouseExecute: vi.fn(),
  jinaReadUrlExecute: vi.fn(),
  jinaScreenshotExecute: vi.fn(),
  searchWithPerplexityMock: vi.fn(),
}))

vi.mock('@/lib/mcp/firecrawl', () => ({
  mcpFirecrawlTools: {
    firecrawl_map: { execute: firecrawlMapExecute },
    firecrawl_crawl: { execute: firecrawlCrawlExecute },
  },
}))

vi.mock('@/lib/mcp/dataforseo', () => ({
  mcpDataforseoTools: {
    on_page_instant_pages: { execute: onPageInstantPagesExecute },
    on_page_content_parsing: { execute: onPageContentParsingExecute },
    on_page_lighthouse: { execute: onPageLighthouseExecute },
  },
}))

vi.mock('@/lib/mcp/jina', () => ({
  mcpJinaTools: {
    read_url: { execute: jinaReadUrlExecute },
    capture_screenshot_url: { execute: jinaScreenshotExecute },
  },
}))

vi.mock('@/lib/external-apis/perplexity', () => ({
  searchWithPerplexity: searchWithPerplexityMock,
}))

import { runWebsiteAudit } from '@/lib/dashboard/website-audit/service'

function buildInstantPagesPayload(overrides?: Record<string, unknown>) {
  return JSON.stringify({
    tasks: [
      {
        result: [
          {
            onpage_score: 86,
            broken_links: false,
            broken_resources: false,
            ...overrides,
          },
        ],
      },
    ],
  })
}

function buildContentParsingPayload() {
  return JSON.stringify({
    tasks: [
      {
        result: [
          {
            headings: [{ level: 1, text: 'Title' }],
          },
        ],
      },
    ],
  })
}

function buildLighthousePayload(options?: { includeCategories?: boolean }) {
  const includeCategories = options?.includeCategories ?? true

  return JSON.stringify({
    tasks: [
      {
        result: [
          {
            items: [
              includeCategories
                ? {
                    lighthouse_result: {
                      categories: {
                        performance: { score: 0.9 },
                        accessibility: { score: 0.92 },
                        seo: { score: 0.94 },
                        'best-practices': { score: 0.91 },
                      },
                    },
                  }
                : {
                    lighthouse_result: {},
                  },
            ],
          },
        ],
      },
    ],
  })
}

function mockHappyPath(options?: { includeJinaScreenshot?: boolean }) {
  firecrawlMapExecute.mockResolvedValue(
    JSON.stringify(['https://example.com', 'https://example.com/about'])
  )
  firecrawlCrawlExecute.mockResolvedValue('{"job_id":"crawl-1"}')
  onPageInstantPagesExecute.mockResolvedValue(buildInstantPagesPayload())
  onPageContentParsingExecute.mockResolvedValue(buildContentParsingPayload())
  onPageLighthouseExecute.mockResolvedValue(buildLighthousePayload())
  jinaReadUrlExecute.mockResolvedValue('ok')

  if (options?.includeJinaScreenshot) {
    jinaScreenshotExecute.mockResolvedValue('ok')
  }

  searchWithPerplexityMock.mockResolvedValue({
    success: true,
    answer: 'All good',
    citations: [],
  })
}

describe('runWebsiteAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns normalized payload with summary and provider status on success', async () => {
    mockHappyPath({ includeJinaScreenshot: true })

    const result = await runWebsiteAudit({
      domain: 'example.com',
      userId: 'user-1',
      includeJinaScreenshot: true,
    })

    expect(result.summary).toBeDefined()
    expect(result.providerStatus).toBeDefined()
    expect(result.providerStatus.providers.firecrawl).toBe('ok')
    expect(result.providerStatus.providers.dataforseo).toBe('ok')
    expect(result.providerStatus.providers.lighthouse).toBe('ok')

    expect(firecrawlMapExecute).toHaveBeenCalledWith(
      { url: 'https://example.com', limit: 15 },
      expect.objectContaining({
        toolCallId: 'website-audit-firecrawl-map-user-1',
        messages: [],
        abortSignal: expect.any(Object),
      })
    )
    expect(firecrawlCrawlExecute).toHaveBeenCalledWith(
      {
        url: 'https://example.com',
        limit: 5,
        maxDiscoveryDepth: 1,
        allowSubdomains: false,
        sitemap: 'include',
      },
      expect.objectContaining({ toolCallId: 'website-audit-firecrawl-crawl-user-1' })
    )
    expect(onPageInstantPagesExecute).toHaveBeenCalledWith(
      { url: 'https://example.com', enable_javascript: true },
      expect.objectContaining({ toolCallId: 'website-audit-dfs-instant-user-1' })
    )
    expect(jinaReadUrlExecute).toHaveBeenCalledWith(
      { url: 'https://example.com', withAllLinks: true },
      expect.objectContaining({ toolCallId: 'website-audit-jina-read-user-1' })
    )
    expect(jinaScreenshotExecute).toHaveBeenCalledWith(
      { url: 'https://example.com', firstScreenOnly: true, return_url: true },
      expect.objectContaining({ toolCallId: 'website-audit-jina-screenshot-user-1' })
    )
    expect(searchWithPerplexityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('example.com'),
        searchRecencyFilter: 'month',
        returnCitations: true,
      })
    )
  })

  it('returns partial payload for DataForSEO partial failures', async () => {
    mockHappyPath()
    onPageContentParsingExecute.mockRejectedValue(new Error('content parsing timeout'))

    const result = await runWebsiteAudit({
      domain: 'example.com',
      userId: 'user-2',
    })

    expect(result.providerStatus.providers.dataforseo).toBe('partial')
    expect(result.providerStatus.providers.lighthouse).toBe('ok')
    expect(result.providerStatus.overall).toBe('partial')
  })

  it('marks lighthouse as partial when categories are missing', async () => {
    mockHappyPath()
    onPageLighthouseExecute.mockResolvedValue(buildLighthousePayload({ includeCategories: false }))

    const result = await runWebsiteAudit({
      domain: 'example.com',
      userId: 'user-3',
    })

    expect(result.providerStatus.providers.lighthouse).toBe('partial')
    expect(result.providerStatus.overall).toBe('partial')
  })

  it('does not call Jina screenshot tool when includeJinaScreenshot is false', async () => {
    mockHappyPath()

    const result = await runWebsiteAudit({
      domain: 'example.com',
      userId: 'user-4',
      includeJinaScreenshot: false,
    })

    expect(result.summary).toBeDefined()
    expect(jinaReadUrlExecute).toHaveBeenCalledTimes(1)
    expect(jinaScreenshotExecute).not.toHaveBeenCalled()
  })

  it('returns payload when Perplexity fails', async () => {
    mockHappyPath()
    searchWithPerplexityMock.mockResolvedValue({
      success: false,
      error: 'Perplexity upstream failure',
    })

    const result = await runWebsiteAudit({
      domain: 'example.com',
      userId: 'user-5',
    })

    expect(result.summary).toBeDefined()
    expect(result.providerStatus.providers.firecrawl).toBe('ok')
    expect(result.providerStatus.providers.dataforseo).toBe('ok')
  })

  it('returns partial firecrawl status when map succeeds and crawl fails', async () => {
    mockHappyPath()
    firecrawlCrawlExecute.mockRejectedValue(new Error('crawl unavailable'))

    const result = await runWebsiteAudit({
      domain: 'example.com',
      userId: 'user-6',
    })

    expect(result.providerStatus.providers.firecrawl).toBe('partial')
    expect(result.providerStatus.overall).toBe('partial')
  })

  it('returns normalized failed payload and skips provider calls for invalid domain', async () => {
    const result = await runWebsiteAudit({
      domain: 'not a domain',
      userId: 'user-7',
    })

    expect(result.providerStatus.overall).toBe('failed')
    expect(result.providerStatus.providers.firecrawl).toBe('failed')
    expect(result.providerStatus.providers.dataforseo).toBe('failed')
    expect(result.providerStatus.providers.lighthouse).toBe('failed')
    expect(result.summary.healthScore).toBe(0)

    expect(firecrawlMapExecute).not.toHaveBeenCalled()
    expect(firecrawlCrawlExecute).not.toHaveBeenCalled()
    expect(onPageInstantPagesExecute).not.toHaveBeenCalled()
    expect(onPageContentParsingExecute).not.toHaveBeenCalled()
    expect(onPageLighthouseExecute).not.toHaveBeenCalled()
    expect(jinaReadUrlExecute).not.toHaveBeenCalled()
    expect(jinaScreenshotExecute).not.toHaveBeenCalled()
    expect(searchWithPerplexityMock).not.toHaveBeenCalled()
  })
})
