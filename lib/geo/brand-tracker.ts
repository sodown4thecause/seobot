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
  fixCycleId?: string
  brand: string
  query: string
  competitors: string[]
  platforms: GeoBrandScanPlatformResult[]
}): Promise<string[]> {
  if (!params.userId) return []

  const rows = await db.insert(geoRuns).values(params.platforms.map((platform) => {
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
      fixCycleId: params.fixCycleId,
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
  })).returning({ id: geoRuns.id })

  return rows.map((row) => row.id)
}

const PLATFORMS = [
  { platform: 'chat_gpt', modelName: 'gpt-4o-mini', label: 'ChatGPT' },
  { platform: 'claude', modelName: 'claude-haiku-4-5-20251001', label: 'Claude' },
  { platform: 'gemini', modelName: 'gemini-2.5-flash', label: 'Gemini' },
  { platform: 'perplexity', modelName: 'sonar', label: 'Perplexity' },
  { platform: 'google_ai_overview', modelName: 'google-organic-serp', label: 'Google AI Overview' },
] as const

async function runPlatform(
  platform: typeof PLATFORMS[number],
  query: string,
  brand: string,
  competitors: string[],
): Promise<GeoBrandScanPlatformResult> {
  const { response, annotations, cost } = platform.platform === 'google_ai_overview'
    ? await callGoogleAIOverview(query)
    : await callLLMResponse({
        query,
        platform: platform.platform,
        modelName: platform.modelName,
      })
  const { brandMentioned, mentionContext, sentiment } = analyzeMention(response, brand)
  return {
    platform: platform.label,
    model: platform.modelName,
    responseText: response,
    responsePreview: response.slice(0, 600),
    brandMentioned,
    mentionContext,
    competitorsMentioned: findCompetitors(response, competitors),
    citations: annotations,
    sentiment,
    estimatedCost: cost,
  }
}

export async function runGEOBrandScan(params: {
  userId?: string
  fixCycleId?: string
  brand: string
  query: string
  engines?: string[]
  competitors?: string[]
}) {
  const { userId, fixCycleId, brand, query, engines, competitors = [] } = params
  console.log('[GEO Brand Tracker] Scanning brand for query')
  const platforms = engines?.length
    ? PLATFORMS.filter((platform) => engines.includes(PLATFORM_ENGINE_MAP[platform.label] ?? platform.platform))
    : PLATFORMS

  const platformResults = await Promise.all(
    platforms.map(async (platform) => {
      let lastError: unknown
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          return await runPlatform(platform, query, brand, competitors)
        } catch (error) {
          lastError = error
        }
      }
      return {
        platform: platform.label,
        model: platform.modelName,
        responseText: '',
        responsePreview: '',
        brandMentioned: false,
        mentionContext: null,
        competitorsMentioned: [],
        citations: [],
        sentiment: 'not_mentioned' as const,
        error: lastError instanceof Error ? lastError.message : 'Probe failed after retry',
      }
    }),
  )

  const successfulPlatforms = platformResults.filter((platform) => !platform.error)
  const mentionedCount = successfulPlatforms.filter((platform) => platform.brandMentioned).length
  const shareOfVoice = successfulPlatforms.length
    ? Math.round((mentionedCount / successfulPlatforms.length) * 100)
    : 0
  const sentiments = successfulPlatforms.filter((platform) => platform.brandMentioned).map((platform) => platform.sentiment)
  const overallSentiment =
    sentiments.includes('positive') ? 'Positive' :
    sentiments.includes('negative') ? 'Negative' :
    mentionedCount > 0 ? 'Neutral' : 'Not mentioned'

  const recommendedFixes = deriveRecommendedFixes({
    brand,
    query,
    platforms: successfulPlatforms,
    summary: {
      totalPlatforms: successfulPlatforms.length,
      mentionedOn: mentionedCount,
      shareOfVoice,
    },
  })

  let runIds: string[] = []
  try {
    runIds = await persistGeoBrandScan({
      userId,
      fixCycleId,
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
    runIds,
    summary: {
      totalPlatforms: successfulPlatforms.length,
      failedPlatforms: platformResults.length - successfulPlatforms.length,
      mentionedOn: mentionedCount,
      shareOfVoice,
      overallSentiment,
    },
    recommendedFixes,
  }
}

export function createGEOBrandScanTool(userId?: string) {
  return tool({
    description:
      'Check whether a brand is mentioned when users ask ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews about a topic. ' +
      'Returns real AI responses, whether the brand appeared, surrounding context, sentiment, competitor co-mentions, and citation URLs. ' +
      'Failed probes are reported separately from brands that were not mentioned.',
    inputSchema: z.object({
      brand: z.string().describe('Brand name to track'),
      query: z.string().describe('Question to ask each AI engine'),
      competitors: z.array(z.string()).optional().describe('Optional competitor brand names'),
    }),
    execute: async ({ brand, query, competitors = [] }) =>
      runGEOBrandScan({ userId, brand, query, competitors }),
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
