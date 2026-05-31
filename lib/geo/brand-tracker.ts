/**
 * GEO Brand Tracker
 *
 * Queries ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews via
 * DataForSEO to detect brand mentions in real AI-generated answers.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'

interface LLMResponseResult {
  response: string
  annotations: Array<{ title: string; url: string }>
  cost?: number
}

type LLMPlatform = 'chat_gpt' | 'claude' | 'gemini' | 'perplexity'

function getDataForSEOCredentials() {
  if (!serverEnv.DATAFORSEO_USERNAME || !serverEnv.DATAFORSEO_PASSWORD) {
    throw new Error('DataForSEO credentials are not configured')
  }

  return Buffer.from(
    `${serverEnv.DATAFORSEO_USERNAME}:${serverEnv.DATAFORSEO_PASSWORD}`
  ).toString('base64')
}

function normalizeAnnotations(
  annotations: Array<{ title?: string; url?: string; domain?: string }> = []
) {
  const seen = new Set<string>()

  return annotations
    .map(annotation => ({
      title: annotation.title ?? annotation.domain ?? annotation.url ?? '',
      url: annotation.url ?? '',
    }))
    .filter(annotation => {
      if (!annotation.url || seen.has(annotation.url)) return false
      seen.add(annotation.url)
      return true
    })
    .slice(0, 8)
}

async function callLLMResponse(params: {
  query: string
  platform: LLMPlatform
  modelName: string
}): Promise<LLMResponseResult> {
  const task: Record<string, unknown> = {
    user_prompt: params.query.slice(0, 500),
    model_name: params.modelName,
    max_output_tokens: 1200,
    temperature: 0.2,
    system_message:
      'Answer as a buyer researching vendors. Mention relevant brands and cite sources when available.',
    tag: `geo-${params.platform}-${Date.now()}`,
  }

  if (params.platform !== 'perplexity') {
    task.web_search = true
  }

  if (params.platform === 'chat_gpt' || params.platform === 'claude') {
    task.force_web_search = true
  }

  const resp = await fetch(
    `https://api.dataforseo.com/v3/ai_optimization/${params.platform}/llm_responses/live`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${getDataForSEOCredentials()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([task]),
    }
  )

  if (!resp.ok) {
    throw new Error(`DataForSEO HTTP ${resp.status}`)
  }

  const data = await resp.json()

  if (data?.status_code && data.status_code !== 20000) {
    throw new Error(`DataForSEO error ${data.status_code}: ${data.status_message}`)
  }

  const dataForSeoTask = data?.tasks?.[0]
  if (dataForSeoTask?.status_code && dataForSeoTask.status_code !== 20000) {
    throw new Error(
      `DataForSEO task error ${dataForSeoTask.status_code}: ${dataForSeoTask.status_message}`
    )
  }

  const result = dataForSeoTask?.result?.[0] ?? {}
  const sections = Array.isArray(result?.message?.sections)
    ? result.message.sections
    : []

  const response = sections
    .filter((section: { type?: string; text?: string }) => section.type === 'text' && section.text)
    .map((section: { text: string }) => section.text)
    .join('\n\n')

  const annotations = sections.flatMap(
    (section: { annotations?: Array<{ title?: string; url?: string }> | null }) =>
      Array.isArray(section.annotations) ? section.annotations : []
  )

  const legacyItems = Array.isArray(result?.items) ? result.items : []
  const firstLegacyItem = legacyItems[0] ?? {}

  return {
    response: response || firstLegacyItem.response || firstLegacyItem.text || '',
    annotations: normalizeAnnotations(
      annotations.length ? annotations : firstLegacyItem.annotations ?? []
    ),
    cost: dataForSeoTask?.cost,
  }
}

async function callGoogleAIOverview(query: string): Promise<LLMResponseResult> {
  const resp = await fetch(
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${getDataForSEOCredentials()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keyword: query,
          location_code: 2840,
          language_code: 'en',
          device: 'desktop',
          depth: 10,
          load_async_ai_overview: true,
          tag: `geo-google-aio-${Date.now()}`,
        },
      ]),
    }
  )

  if (!resp.ok) {
    throw new Error(`DataForSEO HTTP ${resp.status}`)
  }

  const data = await resp.json()

  if (data?.status_code && data.status_code !== 20000) {
    throw new Error(`DataForSEO error ${data.status_code}: ${data.status_message}`)
  }

  const dataForSeoTask = data?.tasks?.[0]
  if (dataForSeoTask?.status_code && dataForSeoTask.status_code !== 20000) {
    throw new Error(
      `DataForSEO task error ${dataForSeoTask.status_code}: ${dataForSeoTask.status_message}`
    )
  }

  const items = dataForSeoTask?.result?.[0]?.items ?? []
  const aiOverview = items.find((item: { type?: string }) => item.type === 'ai_overview')

  if (!aiOverview) {
    return { response: '', annotations: [], cost: dataForSeoTask?.cost }
  }

  const overviewItems = Array.isArray(aiOverview.items) ? aiOverview.items : []
  const response = overviewItems
    .map((item: { title?: string; text?: string }) =>
      [item.title, item.text].filter(Boolean).join('\n')
    )
    .filter(Boolean)
    .join('\n\n')

  const references = [
    ...(Array.isArray(aiOverview.references) ? aiOverview.references : []),
    ...overviewItems.flatMap(
      (item: { references?: Array<{ title?: string; url?: string; domain?: string }> }) =>
        Array.isArray(item.references) ? item.references : []
    ),
  ]

  return {
    response,
    annotations: normalizeAnnotations(references),
    cost: dataForSeoTask?.cost,
  }
}

function analyzeMention(
  response: string,
  brand: string
): {
  brandMentioned: boolean
  mentionContext: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | 'not_mentioned'
} {
  const lower = response.toLowerCase()
  const brandLower = brand.toLowerCase()
  const idx = lower.indexOf(brandLower)

  if (idx === -1) {
    return { brandMentioned: false, mentionContext: null, sentiment: 'not_mentioned' }
  }

  const start = Math.max(0, idx - 100)
  const end = Math.min(response.length, idx + brand.length + 100)
  const mentionContext = response.slice(start, end).trim()
  const ctxLower = mentionContext.toLowerCase()

  const pos = ['best', 'recommend', 'excellent', 'great', 'top', 'leading', 'popular', 'trusted', 'reliable', 'powerful', 'favourite', 'preferred']
  const neg = ['avoid', 'poor', 'bad', 'worst', 'unreliable', 'overpriced', 'problem', 'issue', 'complaint', 'disappointing', 'limited']

  const posScore = pos.filter(w => ctxLower.includes(w)).length
  const negScore = neg.filter(w => ctxLower.includes(w)).length
  const sentiment = posScore > negScore ? 'positive' : negScore > posScore ? 'negative' : 'neutral'

  return { brandMentioned: true, mentionContext, sentiment }
}

function findCompetitors(response: string, competitors: string[]): string[] {
  const lower = response.toLowerCase()
  return competitors.filter(c => lower.includes(c.toLowerCase()))
}

const PLATFORMS = [
  { platform: 'chat_gpt', modelName: 'gpt-4.1-mini', label: 'ChatGPT' },
  { platform: 'claude', modelName: 'claude-3-5-haiku-latest', label: 'Claude' },
  { platform: 'gemini', modelName: 'gemini-2.5-flash', label: 'Gemini' },
  { platform: 'perplexity', modelName: 'sonar', label: 'Perplexity' },
  { platform: 'google_ai_overview', modelName: 'google-organic-serp', label: 'Google AI Overview' },
] as const

export function createGEOBrandScanTool() {
  return tool({
    description:
      'Check whether a brand is mentioned when users ask ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews about a topic. ' +
      'Returns real AI responses, whether the brand appeared, surrounding context, sentiment, competitor co-mentions, and citation URLs. ' +
      'Use this any time the user wants to track brand visibility in AI-generated answers.',
    inputSchema: z.object({
      brand: z.string().describe(
        'The brand name to track (e.g. "Ahrefs", "Flow Intent", "Notion")'
      ),
      query: z.string().describe(
        'The question to ask each AI model (e.g. "best SEO tools 2025", "alternatives to Ahrefs")'
      ),
      competitors: z
        .array(z.string())
        .optional()
        .describe('Optional competitor brand names to also look for in responses'),
    }),
    execute: async ({ brand, query, competitors = [] }) => {
      console.log('[GEO Brand Tracker] Scanning brand for query')

      const settled = await Promise.allSettled(
        PLATFORMS.map(async p => {
          const { response, annotations, cost } = p.platform === 'google_ai_overview'
            ? await callGoogleAIOverview(query)
            : await callLLMResponse({
                query,
                platform: p.platform,
                modelName: p.modelName,
              })

          const { brandMentioned, mentionContext, sentiment } = analyzeMention(response, brand)
          const competitorsMentioned = findCompetitors(response, competitors)

          return {
            platform: p.label,
            model: p.modelName,
            responsePreview: response.slice(0, 600),
            brandMentioned,
            mentionContext,
            competitorsMentioned,
            citations: annotations,
            sentiment,
            estimatedCost: cost,
          }
        })
      )

      const platformResults = settled.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : {
              platform: PLATFORMS[i].label,
              model: PLATFORMS[i].modelName,
              responsePreview: '',
              brandMentioned: false,
              mentionContext: null,
              competitorsMentioned: [],
              citations: [],
              sentiment: 'not_mentioned' as const,
              error: r.reason instanceof Error ? r.reason.message : 'Failed',
            }
      )

      const mentionedCount = platformResults.filter(p => p.brandMentioned).length
      const shareOfVoice = Math.round((mentionedCount / PLATFORMS.length) * 100)

      const sentiments = platformResults.filter(p => p.brandMentioned).map(p => p.sentiment)
      const overallSentiment =
        sentiments.includes('positive') ? 'Positive' :
        sentiments.includes('negative') ? 'Negative' :
        mentionedCount > 0 ? 'Neutral' : 'Not mentioned'

      return {
        success: true,
        brand,
        query,
        platforms: platformResults,
        summary: {
          totalPlatforms: PLATFORMS.length,
          mentionedOn: mentionedCount,
          shareOfVoice,
          overallSentiment,
        },
      }
    },
  })
}

export function getGEOTools() {
  return {
    geo_brand_scan: createGEOBrandScanTool(),
  }
}
