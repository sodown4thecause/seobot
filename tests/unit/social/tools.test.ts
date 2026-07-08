import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSocialTools, runAisaTwitterSearch, runRedditSocialSearch } from '@/lib/social/tools'

const mocks = vi.hoisted(() => ({
  searchTwitter: vi.fn(),
  getTwitterUserInfo: vi.fn(),
  searchPosts: vi.fn(),
}))

vi.mock('@/lib/services/aisa', () => ({
  AisaApiError: class AisaApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly errorCode: string,
      message: string,
    ) {
      super(message)
    }
  },
  searchTwitter: mocks.searchTwitter,
  getTwitterUserInfo: mocks.getTwitterUserInfo,
}))

vi.mock('@/lib/mcp/reddit/search', () => ({
  searchPosts: mocks.searchPosts,
}))

describe('social tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes AIsa X search results from common tweet shapes', async () => {
    mocks.searchTwitter.mockResolvedValue({
      status: 'ok',
      data: {
        tweets: [
          {
            id: '1',
            text: 'FlowIntent is getting mentioned in AI SEO threads.',
            userName: 'founder',
            url: 'https://x.com/founder/status/1',
            likes: 4,
            replies: 2,
            retweets: 1,
            createdAt: '2026-07-07T00:00:00Z',
          },
        ],
      },
    })

    const result = await runAisaTwitterSearch({
      query: 'FlowIntent',
      type: 'Latest',
      limit: 10,
    })

    expect(mocks.searchTwitter).toHaveBeenCalledWith({
      query: 'FlowIntent',
      type: 'Latest',
      limit: 10,
    })
    expect(result.provider).toBe('aisa:twitter')
    expect(result.count).toBe(1)
    expect(result.items[0]).toMatchObject({
      platform: 'x',
      text: 'FlowIntent is getting mentioned in AI SEO threads.',
      author: 'founder',
      source: '@founder',
      engagement: 7,
    })
  })

  it('normalizes Reddit posts into social items', async () => {
    mocks.searchPosts.mockResolvedValue([
      {
        id: 'abc',
        title: 'Best AI SEO tool?',
        selftext: 'I am comparing FlowIntent and Ahrefs.',
        url: 'https://example.com',
        subreddit: 'SEO',
        author: 'user123',
        score: 12,
        upvoteRatio: 0.9,
        numComments: 5,
        createdUtc: 1783382400,
        permalink: '/r/SEO/comments/abc/best_ai_seo_tool/',
        linkFlairText: null,
        isSelf: true,
      },
    ])

    const result = await runRedditSocialSearch({
      query: 'AI SEO tools',
      subreddit: 'SEO',
      sort: 'top',
      time: 'month',
      limit: 5,
    })

    expect(mocks.searchPosts).toHaveBeenCalledWith('AI SEO tools', 'SEO', 'top', 'month', 5)
    expect(result.provider).toBe('reddit-api')
    expect(result.items[0]).toMatchObject({
      platform: 'reddit',
      title: 'Best AI SEO tool?',
      source: 'r/SEO',
      engagement: 17,
      url: 'https://reddit.com/r/SEO/comments/abc/best_ai_seo_tool/',
    })
  })

  it('returns a structured failure when AIsa X search is not exposed', async () => {
    const { AisaApiError } = await import('@/lib/services/aisa')
    mocks.searchTwitter.mockRejectedValue(new AisaApiError(404, 'NotFound', 'Not Found'))

    const result = await runAisaTwitterSearch({
      query: 'FlowIntent',
      type: 'Latest',
      limit: 10,
    })

    expect(result.success).toBe(false)
    expect(result.count).toBe(0)
    expect(result.errorMessage).toMatch(/search relay path is not currently exposed/i)
  })

  it('exports X, Reddit, and Exa tools for Social mode', () => {
    expect(Object.keys(getSocialTools()).sort()).toEqual([
      'aisa_x_profile',
      'aisa_x_search',
      'exa_social_search',
      'reddit_social_search',
    ])
  })
})
