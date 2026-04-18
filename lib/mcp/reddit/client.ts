import 'server-only'

const REDDIT_BASE = 'https://www.reddit.com'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function redditApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${REDDIT_BASE}${endpoint}.json`

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': getRandomUserAgent(),
          Accept: 'application/json',
        },
      })

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000
        console.log(`[Reddit] Rate limited, retrying in ${waitTime}ms...`)
        await sleep(waitTime)
        continue
      }

      if (!response.ok) {
        throw new Error(`[Reddit] API request failed (${response.status}): ${response.statusText}`)
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
  // Not needed for public JSON API
}