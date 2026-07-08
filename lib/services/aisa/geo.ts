import 'server-only'

import {
  chatGptDataForSeoProbe,
  googleAiOverviewSerp,
  googleSerpAiSummary,
} from './dataforseo'
import {
  normalizeAiProbeResult,
  normalizeDataForSeoResponse,
  normalizeGoogleAiOverviewResult,
} from './normalizers'

export async function runChatGptMeasurementProbe(params: {
  userPrompt: string
  modelName?: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}) {
  const endpoint = '/apis/v1/dataforseo/ai_optimization/chat_gpt/llm_responses/live'
  const raw = await chatGptDataForSeoProbe({
    userPrompt: params.userPrompt,
    modelName: params.modelName ?? 'gpt-4o-mini',
    signal: params.signal,
    fetchImpl: params.fetchImpl,
  })

  return {
    ...normalizeDataForSeoResponse(endpoint, raw),
    probe: normalizeAiProbeResult(raw),
  }
}

export async function runGoogleAiOverviewProbe(params: {
  keyword: string
  locationCode?: number
  languageCode?: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}) {
  const endpoint = '/apis/v1/dataforseo/serp/google/organic/live/advanced'
  const raw = await googleAiOverviewSerp(params)

  return {
    ...normalizeDataForSeoResponse(endpoint, raw),
    aiOverview: normalizeGoogleAiOverviewResult(raw),
  }
}

export async function runGoogleSerpAiSummary(params: {
  taskId: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}) {
  const endpoint = '/apis/v1/dataforseo/serp/ai_summary'
  const raw = await googleSerpAiSummary(params)

  return normalizeDataForSeoResponse(endpoint, raw)
}
