import { SITE_URL } from '@/lib/seo/site'

export const INDEXNOW_KEY = 'ef97e8e7948043dc9e730af26d8115c1'
export const INDEXNOW_KEY_FILENAME = `${INDEXNOW_KEY}.txt`
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY_FILENAME}`
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

type IndexNowResult = {
  ok: boolean
  status: number
  submittedUrls: string[]
  body?: string
}

function getHost(): string {
  return new URL(SITE_URL).host
}

export function normalizeIndexNowUrls(urls: string[]): string[] {
  const host = getHost()
  const uniqueUrls = new Set<string>()

  for (const url of urls) {
    try {
      const parsed = new URL(url, SITE_URL)
      if (parsed.host === host) {
        uniqueUrls.add(parsed.toString())
      }
    } catch {
      // Ignore malformed URLs from caller-provided payloads.
    }
  }

  return Array.from(uniqueUrls)
}

export async function submitIndexNowUrls(urls: string[]): Promise<IndexNowResult> {
  const submittedUrls = normalizeIndexNowUrls(urls)

  if (submittedUrls.length === 0) {
    return {
      ok: false,
      status: 400,
      submittedUrls,
      body: 'No valid URLs for this host were provided.',
    }
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host: getHost(),
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: submittedUrls,
    }),
  })

  return {
    ok: response.ok,
    status: response.status,
    submittedUrls,
    body: await response.text().catch(() => undefined),
  }
}
