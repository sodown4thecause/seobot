import 'server-only'

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const REDDIT_BASE = 'https://oauth.reddit.com'

let cachedToken: { accessToken: string; expiresAt: number } | null = null

async function fetchAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID || '0C2vZ0aybA8iA2pXXFqvTA'
  const clientSecret = process.env.REDDIT_CLIENT_SECRET || 'J2o0LXyR3MyxcxkMlLAuirtxWffh6g'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  console.log('[Reddit] Fetching token with client_id:', clientId.substring(0, 8) + '...')

  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
      'User-Agent': 'FlowIntent-RedditGap/1.0',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Reddit] Token request failed:', response.status, errorText)
    throw new Error(`[Reddit] Token request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  console.log('[Reddit] Token received successfully')
  return data.access_token
}

export async function getRedditAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.accessToken
  }

  const accessToken = await fetchAccessToken()
  cachedToken = {
    accessToken,
    expiresAt: now + 23 * 60 * 60 * 1000,
  }

  return accessToken
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function redditApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  let accessToken = await getRedditAccessToken()
  const url = endpoint.startsWith('http') ? endpoint : `${REDDIT_BASE}${endpoint}`

  console.log('[Reddit] Calling API:', endpoint)

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'FlowIntent-RedditGap/1.0',
          Accept: 'application/json',
        },
      })

      console.log('[Reddit] Response status:', response.status, 'for', endpoint)

      if (response.status === 401) {
        console.log('[Reddit] Token expired, refreshing...')
        cachedToken = null
        accessToken = await getRedditAccessToken()
        continue
      }

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000
        console.log(`[Reddit] Rate limited, retrying in ${waitTime}ms...`)
        await sleep(waitTime)
        continue
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`[Reddit] API request failed (${response.status}): ${errorText}`)
      }

      return response.json()
    } catch (error) {
      if (attempt === retries - 1) throw error
      await sleep(Math.pow(2, attempt) * 1000)
    }
  }

  throw new Error('[Reddit] Max retries exceeded')
}

export function clearTokenCache(): void {
  cachedToken = null
}