import 'server-only'

import type { Tool } from 'ai'
import { tool } from 'ai'
import { z } from 'zod'
import { searchPosts } from '@/lib/mcp/reddit/search'
import { AisaApiError, getTwitterUserInfo } from '@/lib/services/aisa'
import { searchExaSocialSources } from '@/lib/social/exa-search'
import { trackAPICall } from '@/lib/analytics/api-tracker'
import { searchTweetsSocialData, getTwitterProfileSocialData } from '@/lib/social/socialdata-client'
import { searchTweetsViaGrok, getTwitterProfileViaGrok } from '@/lib/social/grok-social'
import { serverEnv } from '@/lib/config/env'

export type SocialItem = {
  id?: string
  platform: 'x' | 'reddit' | 'web'
  title?: string
  text: string
  author?: string
  url?: string
  source?: string
  score?: number
  engagement?: number
  createdAt?: string
  raw?: unknown
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number') return value
  }
  return undefined
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = toRecord(value)
  if (!record) return []

  const candidates = [
    record.data,
    record.tweets,
    record.items,
    record.results,
    record.result,
    record.list,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    const nested = toRecord(candidate)
    if (nested) {
      const nestedArray = extractArray(nested)
      if (nestedArray.length) return nestedArray
    }
  }

  return []
}

function normalizeTwitterItems(raw: unknown): SocialItem[] {
  const items: SocialItem[] = []

  for (const item of extractArray(raw)) {
      const record = toRecord(item)
      if (!record) continue
      const text = firstString(record, ['text', 'fullText', 'full_text', 'content', 'tweetText']) ?? ''
      if (!text.trim()) continue

      const url = firstString(record, ['url', 'tweetUrl', 'tweet_url'])
      const id = firstString(record, ['id', 'tweetId', 'tweet_id', 'rest_id'])
      const userRecord = toRecord(record.user)
      const author = firstString(record, ['userName', 'username', 'screen_name', 'author', 'name'])
        ?? (userRecord ? firstString(userRecord, ['screen_name', 'userName', 'username', 'name']) : undefined)
      const likes = firstNumber(record, ['likes', 'favorite_count', 'likeCount'])
      const replies = firstNumber(record, ['replies', 'reply_count', 'replyCount'])
      const reposts = firstNumber(record, ['retweets', 'retweet_count', 'retweetCount', 'reposts'])

      items.push({
        id,
        platform: 'x',
        text,
        author,
        url,
        source: author ? `@${author.replace(/^@/, '')}` : 'X/Twitter',
        engagement: [likes, replies, reposts]
          .filter((value): value is number => typeof value === 'number')
          .reduce((sum, value) => sum + value, 0),
        createdAt: firstString(record, ['createdAt', 'created_at', 'date']),
        raw: item,
      })
  }

  return items
}

export async function runTwitterSearch(input: {
  query: string
  type?: 'Top' | 'Latest' | 'People' | 'Photos' | 'Videos'
  limit?: number
  userId?: string
}) {
  const maxResults = input.limit ?? 20

  if (serverEnv.SOCIALDATA_API_KEY) {
    try {
      const tweets = await searchTweetsSocialData({ query: input.query, numResults: maxResults })
      const items = normalizeTwitterItems(tweets).slice(0, maxResults)
      if (input.userId) {
        await trackAPICall(input.userId, {
          service: 'socialdata',
          endpoint: '/twitter/search',
          method: 'GET',
          statusCode: 200,
          costUSD: 0.0035,
          metadata: {
            provider: 'socialdata',
            query: input.query,
            returnedItems: items.length,
          },
        })
      }
      if (items.length > 0) {
        return {
          success: true as const,
          provider: 'socialdata:twitter',
          query: input.query,
          searchType: input.type ?? 'Latest',
          count: items.length,
          items,
          raw: tweets,
        }
      }
    } catch (error) {
      if (input.userId) {
        await trackAPICall(input.userId, {
          service: 'socialdata',
          endpoint: '/twitter/search',
          method: 'GET',
          statusCode: 500,
          costUSD: 0.0035,
          metadata: {
            provider: 'socialdata',
            query: input.query,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'SocialData search failed',
          },
        })
      }
    }
  }

  if (serverEnv.AI_GATEWAY_API_KEY) {
    try {
      const items = (await searchTweetsViaGrok({ query: input.query })).slice(0, maxResults)
      if (input.userId) {
        await trackAPICall(input.userId, {
          service: 'grok',
          endpoint: '/search',
          method: 'POST',
          statusCode: 200,
          metadata: {
            provider: 'grok',
            query: input.query,
            returnedItems: items.length,
          },
        })
      }
      if (items.length > 0) {
        return {
          success: true as const,
          provider: 'grok:twitter',
          query: input.query,
          searchType: input.type ?? 'Latest',
          count: items.length,
          items,
        }
      }
    } catch (error) {
      if (input.userId) {
        await trackAPICall(input.userId, {
          service: 'grok',
          endpoint: '/search',
          method: 'POST',
          statusCode: 500,
          metadata: {
            provider: 'grok',
            query: input.query,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Grok search failed',
          },
        })
      }
    }
  }

  return {
    success: false as const,
    provider: 'twitter',
    query: input.query,
    searchType: input.type ?? 'Latest',
    count: 0,
    items: [] as SocialItem[],
    errorMessage:
      'X/Twitter search is currently unavailable. SocialData and Grok fallbacks did not return results.',
  }
}

export { runTwitterSearch as runAisaTwitterSearch }

export async function runRedditSocialSearch(input: {
  query: string
  subreddit?: string
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments'
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  limit?: number
}) {
  const posts = await searchPosts(
    input.query,
    input.subreddit,
    input.sort ?? 'relevance',
    input.time ?? 'month',
    input.limit ?? 20,
  )

  const items: SocialItem[] = posts.map(post => ({
    id: post.id,
    platform: 'reddit',
    title: post.title,
    text: post.selftext || post.title,
    author: post.author,
    url: post.permalink ? `https://reddit.com${post.permalink}` : post.url,
    source: `r/${post.subreddit}`,
    score: post.score,
    engagement: post.score + post.numComments,
    createdAt: new Date(post.createdUtc * 1000).toISOString(),
    raw: post,
  }))

  return {
    success: true,
    provider: 'reddit-api',
    query: input.query,
    subreddit: input.subreddit,
    count: items.length,
    items,
  }
}

export async function runExaSocialSearch(input: {
  query: string
  numResults?: number
  startDate?: string
  userId?: string
}) {
  const sources = await searchExaSocialSources({
    query: input.query,
    numResults: input.numResults,
    startDate: input.startDate,
  })

  const items: SocialItem[] = sources.map((source) => ({
    id: source.url,
    platform: 'web',
    title: source.title,
    text: source.highlights?.length
      ? source.highlights.join(' ')
      : source.text ?? source.title,
    author: source.domain,
    url: source.url,
    source: source.domain,
    score: source.score,
    createdAt: source.publishedDate,
    raw: source,
  }))

  if (input.userId) {
    await trackAPICall(input.userId, {
      service: 'exa',
      endpoint: '/search',
      method: 'POST',
      statusCode: 200,
      metadata: {
        provider: 'exa',
        query: input.query,
        returnedItems: items.length,
      },
    })
  }

  return {
    success: true,
    provider: 'exa',
    query: input.query,
    count: items.length,
    items,
    source: 'exa',
  }
}

export interface SocialReport {
  query: string
  totalItems: number
  sources: {
    twitter: { count: number; items: SocialItem[]; error?: string }
    reddit: { count: number; items: SocialItem[]; error?: string }
    exa: { count: number; items: SocialItem[]; error?: string }
  }
  topThemes: string[]
  summary: string
}

const THEME_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'of', 'to', 'in',
  'on', 'at', 'by', 'with', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'you', 'your', 'our', 'i', 'me', 'my', 'he', 'she', 'his', 'her', 'not', 'no',
  'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'can', 'could', 'should',
  'so', 'than', 'too', 'very', 'just', 'about', 'into', 'over', 'after', 'before',
  'up', 'down', 'out', 'off', 'all', 'any', 'some', 'more', 'most', 'such', 'what',
  'which', 'who', 'whom', 'how', 'why', 'when', 'where', 'https', 'http', 'www', 'com',
  'rt', 'via', 'amp',
])

function extractTopThemes(items: SocialItem[]): string[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const text = `${item.title ?? ''} ${item.text ?? ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !THEME_STOPWORDS.has(word))
    for (const word of text) {
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

export async function synthesizeSocialReport(input: {
  query: string
  userId?: string
}): Promise<{ report: SocialReport; source: 'synthesis' }> {
  const query = input.query

  const [twitterResult, redditResult, exaResult] = await Promise.allSettled([
    runTwitterSearch({ query, userId: input.userId }),
    runRedditSocialSearch({ query }),
    runExaSocialSearch({ query, numResults: 5, userId: input.userId }),
  ])

  const twitter = twitterResult.status === 'fulfilled' && twitterResult.value.success
    ? {
        count: twitterResult.value.count,
        items: twitterResult.value.items,
      }
    : {
        count: 0,
        items: [] as SocialItem[],
        error: twitterResult.status === 'rejected'
          ? twitterResult.reason instanceof Error
            ? twitterResult.reason.message
            : 'X/Twitter search failed'
          : twitterResult.status === 'fulfilled'
            ? twitterResult.value.errorMessage
            : undefined,
      }

  let reddit: { count: number; items: SocialItem[]; error?: string }
  if (redditResult.status === 'fulfilled') {
    reddit = {
      count: redditResult.value.count,
      items: redditResult.value.items,
    }
  } else {
    reddit = {
      count: 0,
      items: [],
      error: redditResult.reason instanceof Error
        ? redditResult.reason.message
        : 'Reddit search failed',
    }
  }

  const exa = exaResult.status === 'fulfilled' && exaResult.value.success
    ? {
        count: exaResult.value.count,
        items: exaResult.value.items,
      }
    : {
        count: 0,
        items: [] as SocialItem[],
        error: exaResult.status === 'rejected'
          ? exaResult.reason instanceof Error
            ? exaResult.reason.message
            : 'Exa social search failed'
          : undefined,
      }

  const allItems = [...twitter.items, ...reddit.items, ...exa.items]
  const activeSources = [twitter, reddit, exa].filter((s) => s.count > 0).length
  const topThemes = extractTopThemes(allItems)
  const totalItems = allItems.length
  const summary = `Found ${totalItems} social mentions across ${activeSources} sources. Top themes: ${topThemes.join(', ')}.`

  const report: SocialReport = {
    query,
    totalItems,
    sources: { twitter, reddit, exa },
    topThemes,
    summary,
  }

  return { report, source: 'synthesis' }
}

export function getSocialTools(userId?: string): Record<string, Tool> {
  return {
    aisa_x_profile: tool({
      description:
        'Read an X/Twitter public profile. Use for competitor, creator, brand, or audience account research.',
      inputSchema: z.object({
        username: z.string().describe('X/Twitter username, with or without @'),
      }),
      execute: async ({ username }) => {
        const userName = username.replace(/^@/, '')

        if (serverEnv.SOCIALDATA_API_KEY) {
          const profile = await getTwitterProfileSocialData({ username: userName })
          if (profile) {
            if (userId) {
              await trackAPICall(userId, {
                service: 'socialdata',
                endpoint: '/twitter/user',
                method: 'GET',
                statusCode: 200,
                costUSD: 0.0035,
                metadata: {
                  provider: 'socialdata',
                  username: userName,
                },
              })
            }
            return {
              success: true,
              provider: 'socialdata:twitter',
              username: userName,
              profile,
            }
          }
        }

        try {
          const profile = await getTwitterUserInfo({ userName })
          if (userId) {
            await trackAPICall(userId, {
              service: 'aisa',
              endpoint: '/apis/v1/twitter/user/info',
              method: 'GET',
              statusCode: 200,
              metadata: {
                provider: 'twitter',
                username: userName,
              },
            })
          }
          return {
            success: true,
            provider: 'aisa:twitter',
            username: userName,
            profile,
          }
        } catch (error) {
          if (userId) {
            const statusCode = error instanceof AisaApiError ? error.status : 500
            await trackAPICall(userId, {
              service: 'aisa',
              endpoint: '/apis/v1/twitter/user/info',
              method: 'GET',
              statusCode,
              metadata: {
                provider: 'twitter',
                username: userName,
                success: false,
              },
            })
          }
        }

        if (serverEnv.AI_GATEWAY_API_KEY) {
          const grokProfile = await getTwitterProfileViaGrok({ username: userName })
          if (grokProfile) {
            if (userId) {
              await trackAPICall(userId, {
                service: 'grok',
                endpoint: '/profile',
                method: 'POST',
                statusCode: 200,
                metadata: {
                  provider: 'grok',
                  username: userName,
                },
              })
            }
            return {
              success: true,
              provider: 'grok:twitter',
              username: userName,
              profile: grokProfile,
            }
          }
        }

        return {
          success: false,
          provider: 'twitter',
          username: userName,
          errorMessage: 'X/Twitter profile lookup is currently unavailable.',
        }
      },
    }),
    aisa_x_search: tool({
      description:
        'Search public X/Twitter posts. Use for brand mentions, competitor monitoring, launch reactions, creator research, and social trend discovery.',
      inputSchema: z.object({
        query: z.string().describe('X/Twitter search query'),
        type: z.enum(['Top', 'Latest', 'People', 'Photos', 'Videos']).optional().describe('X search mode'),
        limit: z.number().int().min(1).max(50).optional().describe('Maximum results to normalize'),
      }),
      execute: async ({ query, type, limit }) => runTwitterSearch({ query, type, limit, userId }),
    }),
    reddit_social_search: tool({
      description:
        'Search Reddit posts for customer pain points, brand mentions, competitor reactions, and content gaps.',
      inputSchema: z.object({
        query: z.string().describe('Reddit search query'),
        subreddit: z.string().optional().describe('Optional subreddit name without r/'),
        sort: z.enum(['relevance', 'hot', 'top', 'new', 'comments']).optional(),
        time: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async ({ query, subreddit, sort, time, limit }) =>
        runRedditSocialSearch({ query, subreddit, sort, time, limit }),
    }),
    exa_social_search: tool({
      description:
        'Search the social web via Exa for brand mentions, competitor coverage, creator content, and social signals from across the open web.',
      inputSchema: z.object({
        query: z.string().describe('Exa social-web search query'),
        numResults: z.number().int().min(1).max(20).optional().describe('Maximum results to return'),
        startDate: z.string().optional().describe('Optional start date filter (YYYY-MM-DD)'),
      }),
      execute: async ({ query, numResults, startDate }) =>
        runExaSocialSearch({ query, numResults, startDate, userId }),
    }),
    synthesize_social_report: tool({
      description:
        'Synthesize a multi-source social report combining X/Twitter, Reddit, and Exa social-web results into one unified view with top themes and a summary.',
      inputSchema: z.object({
        query: z.string().describe('Social search query applied across all sources'),
        brand: z.string().optional().describe('Optional brand name to focus the report'),
        competitors: z.array(z.string()).optional().describe('Optional competitor names to include in the report'),
      }),
      execute: async ({ query }) => synthesizeSocialReport({ query, userId }),
    }),
  }
}
