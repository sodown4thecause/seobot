import 'server-only'
import { serverEnv } from '@/lib/config/env'
import { extractDomains } from './utils'

const EXA_BASE_URL = 'https://api.exa.ai'

export type ExaGeoSource = {
  title: string
  url: string
  domain: string
  publishedDate?: string
  author?: string
  text?: string
  highlights?: string[]
  summary?: string
  score?: number
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
    summary?: string
    score?: number
  }>
  costDollars?: unknown
}

export async function searchExaGeoSources(params: {
  query: string
  brand?: string
  competitors?: string[]
  numResults?: number
}): Promise<{
  status: 'completed' | 'not_configured' | 'error'
  sources: ExaGeoSource[]
  requestId?: string
  error?: string
  rawJson?: unknown
}> {
  if (!serverEnv.EXA_API_KEY) {
    return {
      status: 'not_configured',
      sources: [],
      error: 'EXA_API_KEY is not configured',
    }
  }

  const query = [
    params.query,
    params.brand ? `brand: ${params.brand}` : '',
    params.competitors?.length ? `competitors: ${params.competitors.join(', ')}` : '',
    'authoritative sources citations comparisons recommendations',
  ].filter(Boolean).join('\n')

  try {
    const response = await fetch(`${EXA_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': serverEnv.EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        type: 'auto',
        numResults: params.numResults ?? 8,
        text: {
          maxCharacters: 1200,
        },
        highlights: {
          numSentences: 2,
          highlightsPerUrl: 2,
        },
        summary: {
          query: 'Why would an AI answer engine cite this source for this prompt?',
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return {
        status: 'error',
        sources: [],
        error: `Exa HTTP ${response.status}: ${text}`,
      }
    }

    const data = (await response.json()) as ExaSearchResponse
    const sources = (data.results ?? [])
      .filter((result): result is Required<Pick<NonNullable<ExaSearchResponse['results']>[number], 'url'>> & NonNullable<ExaSearchResponse['results']>[number] => (
        typeof result.url === 'string' && result.url.length > 0
      ))
      .map((result) => ({
        title: result.title || result.url,
        url: result.url,
        domain: extractDomains([result.url])[0] || '',
        publishedDate: result.publishedDate,
        author: result.author,
        text: result.text,
        highlights: result.highlights,
        summary: result.summary,
        score: result.score,
      }))

    return {
      status: 'completed',
      sources,
      requestId: data.requestId,
      rawJson: {
        requestId: data.requestId,
        costDollars: data.costDollars,
        resultCount: sources.length,
      },
    }
  } catch (error) {
    return {
      status: 'error',
      sources: [],
      error: error instanceof Error ? error.message : 'Exa search failed',
    }
  }
}
