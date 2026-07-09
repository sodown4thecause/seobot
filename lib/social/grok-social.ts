import 'server-only'

import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { serverEnv } from '@/lib/config/env'
import type { SocialItem } from '@/lib/social/tools'

const GROK_SOCIAL_MODEL = 'xai/grok-4-fast'

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('```')) {
    const withoutStart = trimmed.replace(/^```(?:json)?\s*\n?/, '')
    const withoutEnd = withoutStart.replace(/\n?```\s*$/, '')
    return withoutEnd.trim()
  }
  return trimmed
}

interface GrokSocialPost {
  text?: string
  author?: string
  url?: string
  engagement?: number
  created_at?: string
}

export async function searchTweetsViaGrok(input: {
  query: string
  brand?: string
}): Promise<SocialItem[]> {
  if (!serverEnv.AI_GATEWAY_API_KEY) return []
  try {
    const systemPrompt =
      'You are a social media intelligence assistant. Search X/Twitter for the given query and return relevant posts as JSON. Return an array of objects with: text, author (screen name), url, engagement (likes+retweets), created_at. Only return real posts you can find. If you cannot find any, return an empty array. Return ONLY valid JSON, no markdown.'
    const userPrompt = input.brand
      ? `Search X/Twitter for: "${input.query}" (brand context: ${input.brand})`
      : `Search X/Twitter for: "${input.query}"`

    const result = await generateText({
      model: vercelGateway.languageModel(GROK_SOCIAL_MODEL),
      instructions: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
      abortSignal: AbortSignal.timeout(20000),
    })

    const parsed = JSON.parse(stripMarkdownFences(result.text))
    if (!Array.isArray(parsed)) return []

    const items: SocialItem[] = []
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue
      const post = entry as GrokSocialPost
      const text = typeof post.text === 'string' ? post.text : ''
      if (!text.trim()) continue
      const author = typeof post.author === 'string' ? post.author : undefined
      items.push({
        platform: 'x',
        text,
        author,
        url: typeof post.url === 'string' ? post.url : undefined,
        source: author ? `@${author.replace(/^@/, '')}` : 'X/Twitter',
        engagement: typeof post.engagement === 'number' ? post.engagement : undefined,
        createdAt: typeof post.created_at === 'string' ? post.created_at : undefined,
      })
    }
    return items
  } catch (error) {
    console.error('[Grok Social] search failed:', error instanceof Error ? error.message : error)
    return []
  }
}

export interface GrokTwitterProfile {
  screen_name: string
  name: string
  description: string
  recentTweets: SocialItem[]
}

export async function getTwitterProfileViaGrok(input: {
  username: string
}): Promise<GrokTwitterProfile | null> {
  if (!serverEnv.AI_GATEWAY_API_KEY) return null
  try {
    const username = input.username.replace(/^@/, '')
    const items = await searchTweetsViaGrok({ query: `from:${username}`, brand: username })
    if (items.length === 0) return null
    return {
      screen_name: username,
      name: username,
      description: `X/Twitter profile @${username} (reconstructed via Grok)`,
      recentTweets: items,
    }
  } catch (error) {
    console.error('[Grok Social] profile failed:', error instanceof Error ? error.message : error)
    return null
  }
}
