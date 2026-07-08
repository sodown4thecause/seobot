/**
 * GEO Brand Tracker
 *
 * Queries ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews via
 * AIsa/DataForSEO probes to detect brand mentions in real AI-generated answers.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'
import { geoRuns, type Json } from '@/lib/db/schema'
import { trackAPICall } from '@/lib/analytics/api-tracker'
import { createAICrawlabilityAuditTool } from '@/lib/geo/crawlability-audit'
import { getGeoControlProbeTools } from '@/lib/geo/control-probes'
import { getGEODigestTools } from '@/lib/geo/digest-tool'
import { isElmoConfigured } from '@/lib/geo/elmo-client'
import { getElmoTools } from '@/lib/geo/elmo-tools'
import { createGeoGenerateFixTool } from '@/lib/geo/fix-generator'
import { deriveRecommendedFixes } from '@/lib/geo/recommended-fixes'
import { createSchemaMarkupTool } from '@/lib/geo/schema-markup-tool'
import {
  aiOptimizationLlmResponseProbe,
  googleAiOverviewSerp,
  normalizeAiProbeResult,
  normalizeDataForSeoResponse,
  normalizeGoogleAiOverviewResult,
} from '@/lib/services/aisa'

interface LLMResponseResult {
  response: string
  annotations: Array<{ title: string; url: string }>
  cost?: number
}

type LLMPlatform = 'chat_gpt' | 'claude' | 'gemini' | 'perplexity'
type GeoScanSentiment = 'positive' | 'neutral' | 'negative' | 'not_mentioned'

interface GeoBrandScanPlatformResult {
  platform: string
  model: string
  responseText: string
  responsePreview: string
  brandMentioned: boolean
  mentionContext: string | null
  competitorsMentioned: string[]
  citations: Array<{ title: string; url: string }>
  sentiment: GeoScanSentiment
  estimatedCost?: number
  error?: string
}

const PLATFORM_ENGINE_MAP: Record<string, string> = {
  ChatGPT: 'chatgpt',
  Claude: 'claude',
  Gemini: 'gemini',
  Perplexity: 'perplexity',
  'Google AI Overview': 'google_ai_overview',
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
  const raw = await aiOptimizationLlmResponseProbe({
    engine: params.platform,
    userPrompt: params.query.slice(0, 500),
    modelName: params.modelName,
    maxOutputTokens: 1200,
    temperature: 0.2,
    systemMessage:
      'Answer as a buyer researching vendors. Mention relevant brands and cite sources when available.',
    webSearch: params.platform !== 'perplexity',
    forceWebSearch: params.platform === 'chat_gpt' || params.platform === 'claude',
  })
  const normalized = normalizeDataForSeoResponse(
    `/apis/v1/dataforseo/ai_optimization/${params.platform}/llm_responses/live`,
    raw,
  )
  if (!normalized.ok) {
    throw new Error(
      `AIsa/DataForSEO task error ${normalized.firstError?.statusCode ?? 'unknown'}: ${normalized.firstError?.statusMessage ?? 'Failed'}`
    )
  }

  const probe = normalizeAiProbeResult(raw)

  return {
    response: probe?.responseText ?? '',
    annotations: normalizeAnnotations((probe?.citedUrls ?? []).map(url => ({ url }))),
    cost: normalized.usage.costUsd,
  }
}

async function callGoogleAIOverview(query: string): Promise<LLMResponseResult> {
  const raw = await googleAiOverviewSerp({ keyword: query })
  const normalized = normalizeDataForSeoResponse('/apis/v1/dataforseo/serp/google/organic/live/advanced', raw)
  if (!normalized.ok) {
    throw new Error(
      `AIsa/DataForSEO task error ${normalized.firstError?.statusCode ?? 'unknown'}: ${normalized.firstError?.statusMessage ?? 'Failed'}`
    )
  }
  const aiOverview = normalizeGoogleAiOverviewResult(raw)

  return {
    response: aiOverview?.markdown ?? '',
    annotations: normalizeAnnotations((aiOverview?.citedUrls ?? []).map(url => ({ url }))),
    cost: normalized.usage.costUsd,
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

function visibilityScoreForPlatform(result: GeoBrandScanPlatformResult): number {
  if (!result.brandMentioned) return 0
  if (result.citations.length > 0) return 70
  return 40
}

function citationDomains(citations: Array<{ url: string }>): string[] {
  return Array.from(new Set(citations.flatMap(citation => {
    try {
      return [new URL(citation.url).hostname.replace(/^www\./, '')]
    } catch {
      return []
    }
  })))
}

async function persistGeoBrandScan(params: {
  userId?: string
  brand: string
  query: string
  competitors: string[]
  platforms: GeoBrandScanPlatformResult[]
}) {
  if (!params.userId) return

  await db.insert(geoRuns).values(params.platforms.map((platform) => {
    const citedUrls = platform.citations.map(citation => citation.url)
    const competitorMentions = Object.fromEntries(
      params.competitors.map(competitor => [
        competitor,
        platform.competitorsMentioned.includes(competitor) ? 1 : 0,
      ]),
    )
    const rawJson = {
      source: 'geo_brand_scan',
      platform: platform.platform,
      model: platform.model,
      mentionContext: platform.mentionContext,
      estimatedCost: platform.estimatedCost,
      error: platform.error,
      responsePreview: platform.responsePreview,
    }

    return {
      userId: params.userId,
      engine: PLATFORM_ENGINE_MAP[platform.platform] ?? platform.platform.toLowerCase().replace(/\s+/g, '_'),
      prompt: params.query,
      brand: params.brand,
      competitors: params.competitors,
      responseText: platform.responseText,
      citedUrls,
      citedDomains: citationDomains(platform.citations),
      mentionedBrands: [
        ...(platform.brandMentioned ? [params.brand] : []),
        ...platform.competitorsMentioned,
      ],
      competitorMentions: competitorMentions as Json,
      sentiment: platform.sentiment === 'not_mentioned' ? 'absent' : platform.sentiment,
      brandPosition: platform.brandMentioned ? 1 : null,
      visibilityScore: visibilityScoreForPlatform(platform),
      status: platform.error ? 'error' : 'completed',
      rawJson: rawJson as Json,
      capturedAt: new Date(),
    }
  }))
}

const PLATFORMS = [
  { platform: 'chat_gpt', modelName: 'gpt-4o-mini', label: 'ChatGPT' },
  { platform: 'claude', modelName: 'claude-haiku-4-5-20251001', label: 'Claude' },
  { platform: 'gemini', modelName: 'gemini-2.5-flash', label: 'Gemini' },
  { platform: 'perplexity', modelName: 'sonar', label: 'Perplexity' },
  { platform: 'google_ai_overview', modelName: 'google-organic-serp', label: 'Google AI Overview' },
] as const

export function createGEOBrandScanTool(userId?: string) {
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
            responseText: response,
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

      const platformResults: GeoBrandScanPlatformResult[] = settled.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : {
              platform: PLATFORMS[i].label,
              model: PLATFORMS[i].modelName,
              responseText: '',
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

      const recommendedFixes = deriveRecommendedFixes({
        brand,
        query,
        platforms: platformResults,
        summary: {
          totalPlatforms: PLATFORMS.length,
          mentionedOn: mentionedCount,
          shareOfVoice,
        },
      })

      try {
        await persistGeoBrandScan({
          userId,
          brand,
          query,
          competitors,
          platforms: platformResults,
        })
      } catch (error) {
        console.warn('[GEO Brand Tracker] Failed to persist scan:', error)
      }

      if (userId) {
        await Promise.allSettled(platformResults.map(platform =>
          trackAPICall(userId, {
            service: 'aisa',
            endpoint: `geo_brand_scan:${platform.platform}`,
            method: 'live',
            statusCode: platform.error ? 502 : 200,
            costUSD: platform.estimatedCost,
            metadata: {
              provider: 'dataforseo',
              brand,
              query,
              model: platform.model,
              brandMentioned: platform.brandMentioned,
              citationsCount: platform.citations.length,
              error: platform.error,
            },
          })
        ))
      }

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
        recommendedFixes,
      }
    },
  })
}

export function getGEOTools(userId?: string) {
  return {
    geo_brand_scan: createGEOBrandScanTool(userId),
    geo_generate_fix: createGeoGenerateFixTool(userId),
    generate_schema_markup: createSchemaMarkupTool(),
    ai_crawlability_audit: createAICrawlabilityAuditTool(),
    ...getGeoControlProbeTools(),
    ...getGEODigestTools(),
    ...(isElmoConfigured() ? getElmoTools(userId) : {}),
  }
}

/** Shared GEO execution tools also used in SEO mode for technical AI visibility. */
export function getGeoExecutionTools(userId?: string) {
  return {
    generate_schema_markup: createSchemaMarkupTool(),
    ai_crawlability_audit: createAICrawlabilityAuditTool(),
    geo_generate_fix: createGeoGenerateFixTool(userId),
  }
}
