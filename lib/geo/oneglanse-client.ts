import { generateText } from 'ai'
import { llmResponsesLive } from '@/lib/api/dataforseo-service'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { extractDomains, extractUrls } from './utils'
import type { GeoEngine, GeoEngineAdapterInput, GeoEngineResult } from './types'

const ONEGLANSE_ENGINE_MODELS: Partial<Record<GeoEngine, string>> = {
  perplexity: 'perplexity/sonar',
  gemini: 'google/gemini-3-flash',
  claude: 'anthropic/claude-sonnet-4.6',
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

function parseJsonStringLiteral(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value
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

export async function runOneGlansePrompt(
  engine: GeoEngine,
  input: GeoEngineAdapterInput,
): Promise<GeoEngineResult> {
  if (engine === 'chatgpt') {
    const result = await llmResponsesLive({ prompt: input.prompt })
    if (!result.success) {
      return notConfigured('chatgpt', input, result.error?.message || 'DataForSEO ChatGPT LLM responses unavailable')
    }

    const text = JSON.stringify(result.data)
    return completed('chatgpt', input, extractResponseText(result.data) || text, {
      provider: 'oneglanse-facade:dataforseo',
      data: result.data,
    })
  }

  if (engine === 'google_ai_overview') {
    return notConfigured(
      'google_ai_overview',
      input,
      'OneGlanse facade is ready, but Google AI Overview prompt execution is not configured in this environment.',
    )
  }

  const model = ONEGLANSE_ENGINE_MODELS[engine]
  if (!model) {
    return notConfigured(engine, input, `OneGlanse facade has no adapter for ${engine}`)
  }

  try {
    const result = await generateText({
      model: vercelGateway.languageModel(model),
      prompt: `${input.prompt}

Brand to track: ${input.brand}
Competitors: ${input.competitors?.join(', ') || 'none provided'}
Topic: ${input.topic || 'not provided'}

Answer as ${engine} would for a user researching vendors, sources, or recommendations. Include sources only when the model/provider returns grounded source URLs.`,
      providerOptions: {
        gateway: {
          tags: [`feature:geo-engine:${engine}`, 'feature:oneglanse-facade', 'mode:geo'],
        },
      },
    })

    const sourceUrls = result.sources
      ?.filter((source): source is typeof source & { sourceType: 'url'; url: string } => (
        source.sourceType === 'url' && 'url' in source && typeof source.url === 'string'
      ))
      .map(source => source.url) ?? []

    return completed(engine, input, result.text, {
      provider: 'oneglanse-facade:gateway',
      model,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
      sources: sourceUrls,
    })
  } catch (error) {
    return failed(engine, input, error instanceof Error ? error.message : 'OneGlanse facade gateway request failed')
  }
}
