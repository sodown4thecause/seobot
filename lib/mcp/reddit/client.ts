import 'server-only'

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const REDDIT_BASE_URL = 'https://oauth.reddit.com'

interface RedditTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null

function decodeApiKey(apiKey: string): { clientId: string; clientSecret: string } {
  const decoded = Buffer.from(apiKey, 'base64').toString('utf-8')
  const colonIndex = decoded.indexOf(':')
  if (colonIndex === -1) {
    return { clientId: decoded, clientSecret: '' }
  }
  return {
    clientId: decoded.substring(0, colonIndex),
    clientSecret: decoded.substring(colonIndex + 1),
  }
}

async function fetchAccessToken(): Promise<string> {
  const apiKey = process.env.REDDIT_API_KEY
  if (!apiKey) {
    throw new Error('[Reddit] REDDIT_API_KEY is not set')
  }

  const { clientId, clientSecret } = decodeApiKey(apiKey)

  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'FlowIntent-RedditGap/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`[Reddit] Token request failed (${response.status}): ${errorText}`)
  }

  const data: RedditTokenResponse = await response.json()
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
    expiresAt: now + 23 * 60 * 60 * 1000, // Reddit tokens now expire in 24h, refresh at 23h
  }

  return accessToken
}

export async function redditApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getRedditAccessToken()
  const url = endpoint.startsWith('http') ? endpoint : `${REDDIT_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'FlowIntent-RedditGap/1.0',
      Accept: 'application/json',
    },
  })

  if (response.status === 401) {
    cachedToken = null
    const retryToken = await getRedditAccessToken()
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${retryToken}`,
        'User-Agent': 'FlowIntent-RedditGap/1.0',
        Accept: 'application/json',
      },
    })
    if (!retryResponse.ok) {
      throw new Error(`[Reddit] API request failed after token refresh (${retryResponse.status})`)
    }
    return retryResponse.json()
  }

  if (!response.ok) {
    throw new Error(`[Reddit] API request failed (${response.status}): ${response.statusText}`)
  }

  return response.json()
}

export function clearTokenCache(): void {
  cachedToken = null
}