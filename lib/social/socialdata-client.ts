import 'server-only'

import { serverEnv } from '@/lib/config/env'

export interface SocialDataTweetUser {
  id_str?: string
  screen_name: string
  name: string
  profile_image_url?: string
}

export interface SocialDataTweet {
  id: string
  text: string
  user: SocialDataTweetUser
  created_at: string
  favorite_count: number
  retweet_count: number
  reply_count: number
  quote_count: number
  url: string
}

export interface SocialDataProfile {
  id: number
  screen_name: string
  name: string
  description?: string
  profile_image_url?: string
  followers_count?: number
  friends_count?: number
  statuses_count?: number
  location?: string
  url?: string
  verified?: boolean
}

const SOCIALDATA_BASE_URL = 'https://api.socialdata.tools'
const DEFAULT_TIMEOUT_MS = 15000

export async function searchTweetsSocialData(input: {
  query: string
  numResults?: number
}): Promise<SocialDataTweet[]> {
  if (!serverEnv.SOCIALDATA_API_KEY) return []
  try {
    const params = new URLSearchParams({
      query: input.query,
      max_results: String(input.numResults ?? 20),
    })
    const response = await fetch(
      `${SOCIALDATA_BASE_URL}/twitter/search?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${serverEnv.SOCIALDATA_API_KEY}` },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    )
    if (!response.ok) return []
    const data = await response.json()
    const tweets = Array.isArray(data?.tweets) ? data.tweets : []
    return tweets as SocialDataTweet[]
  } catch (error) {
    console.error('[SocialData] search failed:', error instanceof Error ? error.message : error)
    return []
  }
}

export async function getTwitterProfileSocialData(input: {
  username: string
}): Promise<SocialDataProfile | null> {
  if (!serverEnv.SOCIALDATA_API_KEY) return null
  try {
    const username = input.username.replace(/^@/, '')
    const response = await fetch(
      `${SOCIALDATA_BASE_URL}/twitter/user/${encodeURIComponent(username)}`,
      {
        headers: { Authorization: `Bearer ${serverEnv.SOCIALDATA_API_KEY}` },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    )
    if (!response.ok) return null
    const data = await response.json()
    const profile = data?.user ?? data
    if (!profile || typeof profile !== 'object') return null
    return profile as SocialDataProfile
  } catch (error) {
    console.error('[SocialData] profile failed:', error instanceof Error ? error.message : error)
    return null
  }
}
