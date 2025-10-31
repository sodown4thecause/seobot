import { serverEnv } from '@/lib/config/env'
import type { PerplexityResponse, ApiResult, ApiError } from '@/lib/types/api-responses'

const BASE_URL = 'https://api.perplexity.ai'

async function perplexityFetch(
  messages: Array<{ role: string; content: string }>,
  model: string = 'llama-3.1-sonar-small-128k-online'
): Promise<ApiResult<PerplexityResponse>> {
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverEnv.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      const error: ApiError = {
        code: 'PERPLEXITY_HTTP_ERROR',
        message: `HTTP ${res.status}: ${text}`,
        statusCode: res.status,
      }
      return { success: false, error }
    }

    const data = (await res.json()) as PerplexityResponse
    return { success: true, data }
  } catch (e: unknown) {
    const err = e as Error
    const error: ApiError = {
      code: 'PERPLEXITY_NETWORK_ERROR',
      message: err?.message ?? 'Network error',
      statusCode: 0,
    }
    return { success: false, error }
  }
}

export async function researchTopic(params: { topic: string; contextUrls?: string[] }) {
  const systemPrompt = `You are a research assistant. Provide accurate, up-to-date information with citations.`
  
  let userMessage = `Research the following topic and provide detailed, current information: ${params.topic}`
  
  if (params.contextUrls && params.contextUrls.length > 0) {
    userMessage += `\n\nFocus on these sources: ${params.contextUrls.join(', ')}`
  }

  return perplexityFetch([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ])
}

export async function fetchLatestStats(params: { topic: string; year?: number }) {
  const year = params.year ?? new Date().getFullYear()
  const systemPrompt = `You are a data analyst. Provide accurate statistics with sources.`
  const userMessage = `What are the latest statistics and data points about "${params.topic}" for ${year}? Include numbers, trends, and cite sources.`

  return perplexityFetch([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ])
}

export async function analyzeTrends(params: { topic: string; timeframe?: string }) {
  const timeframe = params.timeframe ?? 'the past year'
  const systemPrompt = `You are a trend analyst. Identify patterns and emerging trends.`
  const userMessage = `Analyze trends related to "${params.topic}" over ${timeframe}. What's growing, declining, or emerging?`

  return perplexityFetch([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ])
}
