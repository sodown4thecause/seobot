import { generateText } from 'ai'
import { llmResponsesLive } from '@/lib/api/dataforseo-service'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { extractDomains, extractUrls } from './utils'
import type { GeoEngine, GeoEngineAdapter, GeoEngineAdapterInput, GeoEngineResult } from './types'

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

function failed(engine: GeoEngine, input: GeoEngineAdapterInput, reason: string): GeoEngineResult {
  return {
    engine,
    prompt: input.prompt,
    responseText: '',
    citedUrls: [],
    citedDomains: [],
    capturedAt: new Date().toISOString(),
    status: 'error',
    error: reason,
  }
}

function completed(engine: GeoEngine, input: GeoEngineAdapterInput, responseText: string, rawJson?: unknown): GeoEngineResult {
  const citedUrls = extractUrls(rawJson ?? responseText)
  return {
    engine,
    prompt: input.prompt,
    responseText,
    citedUrls,
    citedDomains: extractDomains(citedUrls),
    rawJson,
    capturedAt: new Date().toISOString(),
    status: 'completed',
  }
}

class DataForSeoChatGptAdapter implements GeoEngineAdapter {
  async runPrompt(input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
    const result = await llmResponsesLive({ prompt: input.prompt })
    if (!result.success) {
      return notConfigured('chatgpt', input, result.error?.message || 'DataForSEO ChatGPT LLM responses unavailable')
    }

    const text = JSON.stringify(result.data)
    const responseText = extractResponseText(result.data) || text
    return completed('chatgpt', input, responseText, result.data)
  }
}

class DataForSeoGoogleAiOverviewAdapter implements GeoEngineAdapter {
  async runPrompt(input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
    return notConfigured(
      'google_ai_overview',
      input,
      'Google AI Overview prompt execution is not configured. DataForSEO mention search is not used because it does not run the provided prompt.',
    )
  }
}

class GatewayTextAdapter implements GeoEngineAdapter {
  constructor(
    private readonly engine: GeoEngine,
    private readonly model: string,
  ) {}

  async runPrompt(input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
    try {
      const result = await generateText({
        model: vercelGateway.languageModel(this.model),
        prompt: `${input.prompt}

Brand to track: ${input.brand}
Competitors: ${input.competitors?.join(', ') || 'none provided'}

Answer as the target answer engine would. Include sources only if the model/provider returns grounded source URLs.`,
        providerOptions: {
          gateway: {
            tags: [`feature:geo-engine:${this.engine}`],
          },
        },
      })

      return completed(this.engine, input, result.text, { text: result.text, usage: result.usage, finishReason: result.finishReason })
    } catch (error) {
      return failed(this.engine, input, error instanceof Error ? error.message : 'Gateway model request failed')
    }
  }
}

function extractResponseText(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const text = JSON.stringify(data)
  const answerMatches = [...text.matchAll(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/g)]
  if (answerMatches[0]?.[1]) return parseJsonStringLiteral(answerMatches[0][1])
  const responseMatches = [...text.matchAll(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/g)]
  return responseMatches[0]?.[1] ? parseJsonStringLiteral(responseMatches[0][1]) : ''
}

function parseJsonStringLiteral(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value
  }
}

export function getGeoEngineAdapter(engine: GeoEngine): GeoEngineAdapter {
  switch (engine) {
    case 'chatgpt':
      return new DataForSeoChatGptAdapter()
    case 'google_ai_overview':
      return new DataForSeoGoogleAiOverviewAdapter()
    case 'perplexity':
      return new GatewayTextAdapter('perplexity', 'perplexity/sonar')
    case 'gemini':
      return new GatewayTextAdapter('gemini', 'google/gemini-3-flash')
    case 'claude':
      return new GatewayTextAdapter('claude', 'anthropic/claude-sonnet-4.6')
  }
}
