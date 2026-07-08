import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSocialTools, runTwitterSearch, runRedditSocialSearch } from '@/lib/social/tools'
import socialdataFixture from '@/tests/fixtures/social/twitter-search-results.json'

const mocks = vi.hoisted(() => ({
  searchTwitter: vi.fn(),
  getTwitterUserInfo: vi.fn(),
  searchPosts: vi.fn(),
  searchTweetsSocialData: vi.fn(),
  getTwitterProfileSocialData: vi.fn(),
  searchTweetsViaGrok: vi.fn(),
  getTwitterProfileViaGrok: vi.fn(),
}))

vi.mock('@/lib/config/env', () => ({
  serverEnv: {
    SOCIALDATA_API_KEY: 'test-socialdata-key',
    AI_GATEWAY_API_KEY: 'test-gateway-key',
    XAI_API_KEY: 'test-xai-key',
  },
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

vi.mock('@/lib/social/socialdata-client', () => ({
  searchTweetsSocialData: mocks.searchTweetsSocialData,
  getTwitterProfileSocialData: mocks.getTwitterProfileSocialData,
}))

vi.mock('@/lib/social/grok-social', () => ({
  searchTweetsViaGrok: mocks.searchTweetsViaGrok,
  getTwitterProfileViaGrok: mocks.getTwitterProfileViaGrok,
}))

describe('social tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes SocialData X search results into social items', async () => {
    mocks.searchTweetsSocialData.mockResolvedValue(socialdataFixture.socialdata.full.tweets)

    const result = await runTwitterSearch({
      query: 'FlowIntent',
      type: 'Latest',
      limit: 10,
    })

    expect(mocks.searchTweetsSocialData).toHaveBeenCalledWith({
      query: 'FlowIntent',
      numResults: 10,
    })
    expect(result.success).toBe(true)
    expect(result.provider).toBe('socialdata:twitter')
    expect(result.count).toBe(5)
    expect(result.items[0]).toMatchObject({
      platform: 'x',
      text: 'FlowIntent is the best AI SEO tool I have used this year.',
      author: 'seofounder',
      source: '@seofounder',
      engagement: 61,
      url: 'https://x.com/seofounder/status/1801234567890123456',
    })
    expect(mocks.searchTweetsViaGrok).not.toHaveBeenCalled()
  })

  it('falls back to Grok when SocialData returns empty', async () => {
    mocks.searchTweetsSocialData.mockResolvedValue(socialdataFixture.socialdata.empty.tweets)
    mocks.searchTweetsViaGrok.mockResolvedValue(socialdataFixture.grok.full)

    const result = await runTwitterSearch({
      query: 'FlowIntent',
      limit: 10,
    })

    expect(mocks.searchTweetsSocialData).toHaveBeenCalled()
    expect(mocks.searchTweetsViaGrok).toHaveBeenCalledWith({ query: 'FlowIntent' })
    expect(result.success).toBe(true)
    expect(result.provider).toBe('grok:twitter')
    expect(result.count).toBe(3)
    expect(result.items[0]).toMatchObject({
      platform: 'x',
      text: 'FlowIntent is dominating AI SEO conversations this week.',
      author: 'airesearcher',
      source: '@airesearcher',
      engagement: 55,
    })
  })

  it('falls back to Grok when SocialData throws', async () => {
    mocks.searchTweetsSocialData.mockRejectedValue(new Error('SocialData 500'))
    mocks.searchTweetsViaGrok.mockResolvedValue(socialdataFixture.grok.full)

    const result = await runTwitterSearch({
      query: 'FlowIntent',
      limit: 5,
    })

    expect(mocks.searchTweetsViaGrok).toHaveBeenCalledWith({ query: 'FlowIntent' })
    expect(result.success).toBe(true)
    expect(result.provider).toBe('grok:twitter')
    expect(result.count).toBe(3)
  })

  it('returns a structured failure when both SocialData and Grok return empty', async () => {
    mocks.searchTweetsSocialData.mockResolvedValue(socialdataFixture.socialdata.empty.tweets)
    mocks.searchTweetsViaGrok.mockResolvedValue(socialdataFixture.grok.empty)

    const result = await runTwitterSearch({
      query: 'FlowIntent',
      type: 'Latest',
      limit: 10,
    })

    expect(mocks.searchTweetsSocialData).toHaveBeenCalled()
    expect(mocks.searchTweetsViaGrok).toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.count).toBe(0)
    expect(result.items).toEqual([])
    expect(result.errorMessage).toMatch(/unavailable/i)
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

  it('exports X, Reddit, Exa, and synthesis tools for Social mode', () => {
    expect(Object.keys(getSocialTools()).sort()).toEqual([
      'aisa_x_profile',
      'aisa_x_search',
      'exa_social_search',
      'reddit_social_search',
      'synthesize_social_report',
    ])
  })
})
