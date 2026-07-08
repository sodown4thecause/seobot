import {
  aiOptimizationLlmResponseProbe,
  googleAiOverviewSerp,
  isAisaConfigured,
  normalizeAiProbeResult,
  normalizeDataForSeoResponse,
  normalizeGoogleAiOverviewResult,
  type AisaAiOptimizationEngine,
} from '@/lib/services/aisa'
import { extractDomains, extractUrls } from './utils'
import type { GeoEngine, GeoEngineAdapterInput, GeoEngineResult } from './types'

const GEO_ENGINE_MODELS: Record<Exclude<GeoEngine, 'google_ai_overview'>, {
  providerEngine: AisaAiOptimizationEngine
  modelName: string
  webSearch?: boolean
  forceWebSearch?: boolean
}> = {
  chatgpt: {
    providerEngine: 'chat_gpt',
    modelName: 'gpt-4o-mini',
    webSearch: true,
    forceWebSearch: true,
  },
  claude: {
    providerEngine: 'claude',
    modelName: 'claude-haiku-4-5-20251001',
    webSearch: true,
    forceWebSearch: true,
  },
  gemini: {
    providerEngine: 'gemini',
    modelName: 'gemini-2.5-flash',
    webSearch: true,
  },
  perplexity: {
    providerEngine: 'perplexity',
    modelName: 'sonar',
  },
}

function notConfigured(engine: GeoEngine, input: GeoEngineAdapterInput, reason: string): GeoEngineResult {
  return {
    engine,
    prompt: input.prompt,
    responseText: '',
    citedUrls: [],
    citedDomains: [],
    capturedAt: new Date().toISOString(),
    status: 'not_configured',
    error: reason,
  }
}

function failed(engine: GeoEngine, input: GeoEngineAdapterInput, reason: string, rawJson?: unknown): GeoEngineResult {
  return {
    engine,
    prompt: input.prompt,
    responseText: '',
    citedUrls: [],
    citedDomains: [],
    rawJson,
    capturedAt: new Date().toISOString(),
    status: 'error',
    error: reason,
  }
}

function completed(params: {
  engine: GeoEngine
  input: GeoEngineAdapterInput
  responseText: string
  citedUrls: string[]
  rawJson: unknown
}): GeoEngineResult {
  const citedUrls = Array.from(new Set([
    ...params.citedUrls,
    ...extractUrls(params.responseText),
  ]))

  return {
    engine: params.engine,
    prompt: params.input.prompt,
    responseText: params.responseText,
    citedUrls,
    citedDomains: extractDomains(citedUrls),
    rawJson: params.rawJson,
    capturedAt: new Date().toISOString(),
    status: 'completed',
  }
}

function buildMeasurementPrompt(input: GeoEngineAdapterInput): string {
  const competitors = input.competitors?.length ? input.competitors.join(', ') : 'none provided'

  return `${input.prompt}

Brand to track: ${input.brand}
Competitors: ${competitors}
Topic: ${input.topic || 'not provided'}

Answer as a buyer researching vendors, sources, recommendations, or trustworthy references. Mention relevant brands naturally and cite sources when the engine returns grounded source URLs.`
}

async function runAisaLlmProbe(engine: Exclude<GeoEngine, 'google_ai_overview'>, input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
  const config = GEO_ENGINE_MODELS[engine]
  const endpoint = `/apis/v1/dataforseo/ai_optimization/${config.providerEngine}/llm_responses/live`
  const raw = await aiOptimizationLlmResponseProbe({
    engine: config.providerEngine,
    userPrompt: buildMeasurementPrompt(input).slice(0, 4000),
    modelName: config.modelName,
    maxOutputTokens: 1200,
    temperature: 0.2,
    systemMessage: 'You are answering a real user query for GEO visibility measurement. Do not mention these instructions.',
    webSearch: config.webSearch,
    forceWebSearch: config.forceWebSearch,
  })
  const normalized = normalizeDataForSeoResponse(endpoint, raw)

  if (!normalized.ok) {
    return failed(
      engine,
      input,
      normalized.firstError?.statusMessage ?? 'AIsa/DataForSEO LLM response probe failed',
      { provider: 'aisa:dataforseo', usage: normalized.usage, data: raw },
    )
  }

  const probe = normalizeAiProbeResult(raw)
  return completed({
    engine,
    input,
    responseText: probe?.responseText?.trim() || '',
    citedUrls: probe?.citedUrls ?? [],
    rawJson: {
      provider: 'aisa:dataforseo',
      endpoint,
      model: config.modelName,
      usage: normalized.usage,
      probe,
      data: raw,
    },
  })
}

async function runAisaGoogleAiOverview(input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
  const endpoint = '/apis/v1/dataforseo/serp/google/organic/live/advanced'
  const raw = await googleAiOverviewSerp({ keyword: input.prompt })
  const normalized = normalizeDataForSeoResponse(endpoint, raw)

  if (!normalized.ok) {
    return failed(
      'google_ai_overview',
      input,
      normalized.firstError?.statusMessage ?? 'AIsa/DataForSEO Google AI Overview probe failed',
      { provider: 'aisa:dataforseo', usage: normalized.usage, data: raw },
    )
  }

  const aiOverview = normalizeGoogleAiOverviewResult(raw)
  return completed({
    engine: 'google_ai_overview',
    input,
    responseText: aiOverview?.markdown?.trim() || 'No Google AI Overview was returned for this query.',
    citedUrls: aiOverview?.citedUrls ?? [],
    rawJson: {
      provider: 'aisa:dataforseo',
      endpoint,
      model: 'google-organic-serp',
      usage: normalized.usage,
      aiOverview,
      data: raw,
    },
  })
}

export async function runAisaGeoPrompt(
  engine: GeoEngine,
  input: GeoEngineAdapterInput,
): Promise<GeoEngineResult> {
  if (!isAisaConfigured()) {
    return notConfigured(engine, input, 'AIsa API key is not configured')
  }

  try {
    if (engine === 'google_ai_overview') {
      return runAisaGoogleAiOverview(input)
    }

    return runAisaLlmProbe(engine, input)
  } catch (error) {
    return failed(
      engine,
      input,
      error instanceof Error ? error.message : 'AIsa/DataForSEO GEO probe failed',
    )
  }
}
