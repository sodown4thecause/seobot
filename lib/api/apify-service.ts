import { serverEnv } from '@/lib/config/env'
import type { ApifyActorRun, SocialPost, ApiResult, ApiError } from '@/lib/types/api-responses'

const BASE_URL = 'https://api.apify.com/v2'

async function apifyFetch<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}?token=${serverEnv.APIFY_API_KEY}`, options)

    if (!res.ok) {
      const text = await res.text()
      const error: ApiError = {
        code: 'APIFY_HTTP_ERROR',
        message: `HTTP ${res.status}: ${text}`,
        statusCode: res.status,
      }
      return { success: false, error }
    }

    const data = (await res.json()) as T
    return { success: true, data }
  } catch (e: unknown) {
    const err = e as Error
    const error: ApiError = {
      code: 'APIFY_NETWORK_ERROR',
      message: err?.message ?? 'Network error',
      statusCode: 0,
    }
    return { success: false, error }
  }
}

async function pollActorRun(runId: string, maxAttempts = 60): Promise<ApiResult<ApifyActorRun>> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await apifyFetch<{ data: ApifyActorRun }>(`/actor-runs/${runId}`)
    
    if (!result.success) {
      return result
    }

    const run = result.data.data
    
    if (run.status === 'SUCCEEDED') {
      return { success: true, data: run }
    }
    
    if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
      const error: ApiError = {
        code: 'APIFY_RUN_FAILED',
        message: `Actor run ${run.status}: ${run.statusMessage || 'Unknown error'}`,
        statusCode: 500,
      }
      return { success: false, error }
    }

    // Wait before polling again (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(1.5, i), 10000)))
  }

  const error: ApiError = {
    code: 'APIFY_TIMEOUT',
    message: 'Actor run timed out',
    statusCode: 408,
  }
  return { success: false, error }
}

async function getDatasetItems<T>(datasetId: string): Promise<ApiResult<T[]>> {
  const result = await apifyFetch<T[]>(`/datasets/${datasetId}/items?format=json`)
  return result
}

export async function callActor<TInput, TOutput>(params: {
  actorId: string
  input: TInput
  timeout?: number
}): Promise<ApiResult<TOutput[]>> {
  // Start the actor run
  const startResult = await apifyFetch<{ data: ApifyActorRun }>(`/acts/${params.actorId}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.input),
  })

  if (!startResult.success) {
    return startResult
  }

  const runId = startResult.data.data.id

  // Poll until completion
  const pollResult = await pollActorRun(runId, params.timeout ? Math.ceil(params.timeout / 1000) : 60)
  
  if (!pollResult.success) {
    return pollResult
  }

  // Fetch dataset items
  const datasetId = pollResult.data.defaultDatasetId
  return getDatasetItems<TOutput>(datasetId)
}

// Twitter/X scraping
export async function fetchTwitterPosts(params: {
  username: string
  maxPosts?: number
}): Promise<ApiResult<SocialPost[]>> {
  const result = await callActor<
    { handles: string[]; tweetsDesired: number },
    { text: string; url: string; timestamp: string; author: unknown; likes: number; retweets: number }
  >({
    actorId: 'apidojo/tweet-scraper',
    input: {
      handles: [params.username],
      tweetsDesired: params.maxPosts ?? 50,
    },
  })

  if (!result.success) {
    return result
  }

  const posts: SocialPost[] = result.data.map(item => ({
    platform: 'twitter' as const,
    text: item.text || '',
    url: item.url || '',
    timestamp: item.timestamp || new Date().toISOString(),
    author: {
      username: params.username,
    },
    engagement: {
      likes: item.likes,
      shares: item.retweets,
    },
  }))

  return { success: true, data: posts }
}

// LinkedIn scraping
export async function fetchLinkedInPosts(params: {
  profileUrl: string
  maxPosts?: number
}): Promise<ApiResult<SocialPost[]>> {
  const result = await callActor<
    { startUrls: Array<{ url: string }>; maxPosts: number },
    { text: string; url: string; publishedAt: string; author: { name: string }; likes: number; comments: number }
  >({
    actorId: 'apify/linkedin-profile-scraper',
    input: {
      startUrls: [{ url: params.profileUrl }],
      maxPosts: params.maxPosts ?? 50,
    },
  })

  if (!result.success) {
    return result
  }

  const posts: SocialPost[] = result.data.map(item => ({
    platform: 'linkedin' as const,
    text: item.text || '',
    url: item.url || '',
    timestamp: item.publishedAt || new Date().toISOString(),
    author: {
      username: item.author?.name || '',
      displayName: item.author?.name,
    },
    engagement: {
      likes: item.likes,
      comments: item.comments,
    },
  }))

  return { success: true, data: posts }
}

// Instagram scraping
export async function fetchInstagramPosts(params: {
  username: string
  maxPosts?: number
}): Promise<ApiResult<SocialPost[]>> {
  const result = await callActor<
    { usernames: string[]; resultsLimit: number },
    { caption: string; url: string; timestamp: string; ownerUsername: string; likesCount: number; commentsCount: number }
  >({
    actorId: 'apify/instagram-profile-scraper',
    input: {
      usernames: [params.username],
      resultsLimit: params.maxPosts ?? 50,
    },
  })

  if (!result.success) {
    return result
  }

  const posts: SocialPost[] = result.data.map(item => ({
    platform: 'instagram' as const,
    text: item.caption || '',
    url: item.url || '',
    timestamp: item.timestamp || new Date().toISOString(),
    author: {
      username: item.ownerUsername || params.username,
    },
    engagement: {
      likes: item.likesCount,
      comments: item.commentsCount,
    },
  }))

  return { success: true, data: posts }
}
