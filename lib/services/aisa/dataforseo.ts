import 'server-only'

import { aisaFetch } from './client'
import { dataForSeoResponseSchema, type DataForSeoResponse } from './schemas'

function dataForSeoPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `/apis/v1/dataforseo${normalized}`
}

export async function postAisaDataForSeoTasks(
  path: string,
  tasks: Array<Record<string, unknown>>,
  options: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<DataForSeoResponse> {
  return aisaFetch(
    dataForSeoPath(path),
    dataForSeoResponseSchema,
    {
      method: 'POST',
      body: tasks,
      signal: options.signal,
      fetchImpl: options.fetchImpl,
    },
  )
}

export function chatGptDataForSeoProbe(params: {
  userPrompt: string
  modelName: string
  maxOutputTokens?: number
  systemMessage?: string
  webSearch?: boolean
  forceWebSearch?: boolean
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/ai_optimization/chat_gpt/llm_responses/live',
    [{
      user_prompt: params.userPrompt,
      model_name: params.modelName,
      max_output_tokens: params.maxOutputTokens,
      system_message: params.systemMessage,
      web_search: params.webSearch,
      force_web_search: params.forceWebSearch,
    }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export type AisaAiOptimizationEngine = 'chat_gpt' | 'gemini' | 'perplexity' | 'claude'

export function aiOptimizationLlmResponseProbe(params: {
  engine: AisaAiOptimizationEngine
  userPrompt: string
  modelName: string
  maxOutputTokens?: number
  systemMessage?: string
  webSearch?: boolean
  forceWebSearch?: boolean
  temperature?: number
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    `/ai_optimization/${params.engine}/llm_responses/live`,
    [{
      user_prompt: params.userPrompt,
      model_name: params.modelName,
      max_output_tokens: params.maxOutputTokens,
      system_message: params.systemMessage,
      web_search: params.webSearch,
      force_web_search: params.forceWebSearch,
      temperature: params.temperature,
    }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export function googleAiOverviewSerp(params: {
  keyword: string
  locationCode?: number
  languageCode?: string
  device?: 'desktop' | 'mobile'
  os?: 'windows' | 'macos' | 'android' | 'ios'
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/serp/google/organic/live/advanced',
    [{
      keyword: params.keyword,
      location_code: params.locationCode ?? 2840,
      language_code: params.languageCode ?? 'en',
      device: params.device ?? 'desktop',
      os: params.os ?? 'windows',
      load_async_ai_overview: true,
      expand_ai_overview: true,
    }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export function googleSerpAiSummary(params: {
  taskId: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/serp/ai_summary',
    [{ task_id: params.taskId }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export function backlinksSummary(params: {
  target: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/backlinks/summary/live',
    [{ target: params.target }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export function backlinksList(params: {
  target: string
  limit?: number
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/backlinks/backlinks/live',
    [{
      target: params.target,
      limit: params.limit ?? 10,
    }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export function referringDomains(params: {
  target: string
  limit?: number
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/backlinks/referring_domains/live',
    [{
      target: params.target,
      limit: params.limit ?? 10,
    }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}

export function backlinkAnchors(params: {
  target: string
  limit?: number
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}) {
  return postAisaDataForSeoTasks(
    '/backlinks/anchors/live',
    [{
      target: params.target,
      limit: params.limit ?? 10,
    }],
    { fetchImpl: params.fetchImpl, signal: params.signal },
  )
}
