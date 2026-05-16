/**
 * GEO Brand Tracker
 *
 * Queries ChatGPT, Gemini, and Perplexity via DataForSEO's llm_response API
 * to detect brand mentions in real AI-generated answers.
 *
 * Available on the current DataForSEO plan (no $100 upgrade needed).
 * Costs ~$0.075 per full 3-platform scan for one query.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'

// ---------------------------------------------------------------------------
// DataForSEO API call
// ---------------------------------------------------------------------------

interface LLMResponseResult {
  response: string
  annotations: Array<{ title: string; url: string }>
  cost?: number
}

async function callLLMResponse(params: {
  query: string
  platform: string
  model: string
}): Promise<LLMResponseResult> {
  const credentials = btoa(
    `${serverEnv.DATAFORSEO_USERNAME}:${serverEnv.DATAFORSEO_PASSWORD}`
  )

  const resp = await fetch(
    'https://api.dataforseo.com/v3/ai_optimization/llm_response/live',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          query: params.query,
          platform: params.platform,
          model: params.model,
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

  const task = data?.tasks?.[0]
  if (task?.status_code && task.status_code !== 20000) {
    throw new Error(`DataForSEO task error ${task.status_code}: ${task.status_message}`)
  }

  const items = task?.result?.[0]?.items ?? []
  const first = items[0] ?? {}

  return {
    response: first.response ?? '',
    annotations: (first.annotations ?? []).slice(0, 6).map((a: any) => ({
      title: a.title ?? a.url ?? '',
      url: a.url ?? '',
    })),
    cost: task?.cost,
  }
}

// ---------------------------------------------------------------------------
// Mention parsing
// ---------------------------------------------------------------------------

function analyseMention(
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

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

const PLATFORMS = [
  { platform: 'chat_gpt', model: 'gpt-4o-mini', label: 'ChatGPT' },
  { platform: 'gemini',   model: 'gemini-2.0-flash', label: 'Gemini' },
  { platform: 'perplexity', model: 'sonar', label: 'Perplexity' },
] as const

export function createGEOBrandScanTool() {
  return tool({
    description:
      'Check whether a brand is mentioned when users ask ChatGPT, Gemini, and Perplexity about a topic. ' +
      'Returns real AI responses, whether the brand appeared, surrounding context, sentiment, and (for Perplexity) actual citation URLs. ' +
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
      console.log('[GEO Brand Tracker] Scanning:', { brand, query })

      const settled = await Promise.allSettled(
        PLATFORMS.map(async p => {
          const { response, annotations, cost } = await callLLMResponse({
            query,
            platform: p.platform,
            model: p.model,
          })

          const { brandMentioned, mentionContext, sentiment } = analyseMention(response, brand)
          const competitorsMentioned = findCompetitors(response, competitors)

          return {
            platform: p.label,
            model: p.model,
            // Truncate raw response — the LLM will summarise it
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
              model: PLATFORMS[i].model,
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

/**
 * All tools exported for the GEO agent.
 */
export function getGEOTools() {
  return {
    geo_brand_scan: createGEOBrandScanTool(),
  }
}
