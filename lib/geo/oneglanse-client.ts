import { generateText } from 'ai'
import {
  googleAiOverviewSerp,
  llmResponsesLive,
  type DataForSEOGoogleAiOverviewItem,
} from '@/lib/api/dataforseo-service'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { extractDomains, extractUrls } from './utils'
import { searchExaGeoSources } from './exa-client'
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

function completed(
  engine: GeoEngine,
  input: GeoEngineAdapterInput,
  responseText: string,
  rawJson?: unknown,
  explicitCitedUrls: string[] = [],
  options: { extractRawUrls?: boolean } = {},
): GeoEngineResult {
  const extractedUrls = options.extractRawUrls === false
    ? extractUrls(responseText)
    : extractUrls(rawJson ?? responseText)
  const citedUrls = Array.from(new Set([
    ...explicitCitedUrls,
    ...extractedUrls,
  ]))

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

function pickGoogleAiOverviewItems(data: unknown): DataForSEOGoogleAiOverviewItem[] {
  if (!data || typeof data !== 'object') return []
  const response = data as {
    tasks?: Array<{
      result?: Array<{
        items?: DataForSEOGoogleAiOverviewItem[]
      }>
    }>
  }

  return response.tasks
    ?.flatMap(task => task.result ?? [])
    .flatMap(result => result.items ?? [])
    .filter(item => item.type === 'ai_overview') ?? []
}

function stringifyGoogleAiOverviewItem(item: DataForSEOGoogleAiOverviewItem): string {
  if (typeof item.markdown === 'string' && item.markdown.trim()) return item.markdown.trim()
  if (typeof item.text === 'string' && item.text.trim()) return item.text.trim()
  if (!Array.isArray(item.items) || item.items.length === 0) return ''

  const nestedText = JSON.stringify(item.items)
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim()

  return nestedText
}

async function runGoogleAiOverview(input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
  const dataForSeoResult = await googleAiOverviewSerp({ query: input.prompt })

  if (!dataForSeoResult.success) {
    return failed(
      'google_ai_overview',
      input,
      dataForSeoResult.error?.message || 'DataForSEO Google AI Overview SERP request failed',
    )
  }

  const exaResult = await searchExaGeoSources({
    query: input.prompt,
    brand: input.brand,
    competitors: input.competitors,
    numResults: 8,
  })

  const aiOverviewItems = pickGoogleAiOverviewItems(dataForSeoResult.data)
  const responseText = aiOverviewItems
    .map(stringifyGoogleAiOverviewItem)
    .filter(Boolean)
    .join('\n\n')
    || 'No Google AI Overview was returned for this query.'

  const citedUrls = aiOverviewItems.flatMap(item => (
    item.references
      ?.map(reference => reference.url)
      .filter((url): url is string => typeof url === 'string' && url.length > 0) ?? []
  ))

  return completed('google_ai_overview', input, responseText, {
    provider: 'oneglanse-facade:dataforseo-google-ai-overview',
    dataforseo: {
      statusCode: dataForSeoResult.data.status_code,
      statusMessage: dataForSeoResult.data.status_message,
      cost: dataForSeoResult.data.cost,
      tasks: dataForSeoResult.data.tasks?.map(task => ({
        id: task.id,
        statusCode: task.status_code,
        statusMessage: task.status_message,
        cost: task.cost,
        itemTypes: task.result?.flatMap(result => result.item_types ?? []),
        checkUrls: task.result?.map(result => result.check_url).filter(Boolean),
      })),
      aiOverviewItems,
    },
    exaSourceOpportunities: {
      status: exaResult.status,
      error: exaResult.error,
      requestId: exaResult.requestId,
      sources: exaResult.sources,
      rawJson: exaResult.rawJson,
    },
  }, citedUrls, { extractRawUrls: false })
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
    return runGoogleAiOverview(input)
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
    }, sourceUrls)
  } catch (error) {
    return failed(engine, input, error instanceof Error ? error.message : 'OneGlanse facade gateway request failed')
  }
}
