import 'server-only'
import { serverEnv } from '@/lib/config/env'

const EXA_BASE_URL = 'https://api.exa.ai'
const EXA_SEARCH_TIMEOUT_MS = 10_000

export type ExaSocialResult = {
  title: string
  url: string
  domain: string
  text?: string
  highlights?: string[]
  score?: number
  publishedDate?: string
  sourceType: 'exa_social'
}

type ExaSearchResponse = {
  requestId?: string
  results?: Array<{
    title?: string
    url?: string
    publishedDate?: string
    author?: string
    text?: string
    highlights?: string[]
    score?: number
  }>
  costDollars?: unknown
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export async function searchExaSocialSources(params: {
  query: string
  numResults?: number
  startDate?: string
}): Promise<ExaSocialResult[]> {
  if (!serverEnv.EXA_API_KEY) return []

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), EXA_SEARCH_TIMEOUT_MS)

  try {
    const body: Record<string, unknown> = {
      query: params.query,
      type: 'auto',
      numResults: params.numResults ?? 10,
      contents: {
        text: {
          maxCharacters: 1000,
        },
        highlights: true,
      },
    }
    if (params.startDate) {
      body.start = params.startDate
    }

    const response = await fetch(`${EXA_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': serverEnv.EXA_API_KEY,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Exa search request failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as ExaSearchResponse
    const sources = (data.results ?? [])
      .filter((result): result is typeof result & { url: string } => (
        typeof result.url === 'string' && result.url.length > 0
      ))
      .map((result) => ({
        title: result.title || result.url,
        url: result.url,
        domain: extractDomain(result.url),
        text: result.text,
        highlights: Array.isArray(result.highlights) ? result.highlights : undefined,
        score: typeof result.score === 'number' ? result.score : undefined,
        publishedDate: result.publishedDate,
        sourceType: 'exa_social' as const,
      }))

    return sources
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}