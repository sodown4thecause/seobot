import 'server-only'

const SUPADATA_BASE_URL = 'https://api.supadata.ai/v1'

interface SupadataScrapeResponse {
  url: string
  content: string
  name: string
  description: string
  ogUrl: string
  countCharacters: number
  urls: string[]
}

interface SupadataErrorResponse {
  error: string
  message: string
  statusCode: number
}

function getApiKey(): string {
  const key = process.env.SUPADATA_API_KEY
  if (!key) {
    throw new Error('[Supadata] SUPADATA_API_KEY is not set')
  }
  return key
}

export async function scrapeUrl(url: string, options?: { lang?: string; noLinks?: boolean }): Promise<SupadataScrapeResponse> {
  const apiKey = getApiKey()
  const params = new URLSearchParams({ url })

  if (options?.lang) params.set('lang', options.lang)
  if (options?.noLinks) params.set('noLinks', 'true')

  const response = await fetch(`${SUPADATA_BASE_URL}/web/scrape?${params.toString()}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  })

  if (!response.ok) {
    const errorBody = await response.text()
    let errorMessage = `Supadata scrape failed (${response.status})`
    try {
      const errorData = JSON.parse(errorBody) as SupadataErrorResponse
      errorMessage = `Supadata scrape failed: ${errorData.message || errorData.error}`
    } catch {
      errorMessage = `Supadata scrape failed (${response.status}): ${errorBody.slice(0, 200)}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function scrapeRedditThread(
  subreddit: string,
  postId: string
): Promise<{ content: string; title: string; url: string; description: string }> {
  const redditUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}/`
  
  try {
    const result = await scrapeUrl(redditUrl, { noLinks: true })
    return {
      content: result.content,
      title: result.name || '',
      url: result.url,
      description: result.description || '',
    }
  } catch (error) {
    console.warn(`[Supadata] Failed to scrape Reddit thread ${postId}:`, error)
    return {
      content: '',
      title: '',
      url: redditUrl,
      description: '',
    }
  }
}