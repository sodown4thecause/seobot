import 'server-only'

const REDDIT_JSON_BASE = 'https://www.reddit.com'

export async function redditApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${REDDIT_JSON_BASE}${endpoint}.json`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'User-Agent': 'FlowIntent-RedditGap/1.0',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`[Reddit] API request failed (${response.status}): ${response.statusText}`)
  }

  return response.json()
}

export function clearTokenCache(): void {
  // No token caching needed for public JSON API
}