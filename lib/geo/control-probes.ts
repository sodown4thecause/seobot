import { generateText, tool } from 'ai'
import { z } from 'zod'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { searchWithPerplexity, type PerplexityCitation } from '@/lib/external-apis/perplexity'
import { countMentions, extractDomains, extractUrls } from './utils'

const GATEWAY_CONTROL_MODELS = {
  chatgpt: 'openai/gpt-5.5',
  claude: 'anthropic/claude-sonnet-4.6',
  gemini: 'google/gemini-3.0-pro',
  perplexity: 'perplexity/sonar',
} as const

type GatewayControlEngine = keyof typeof GATEWAY_CONTROL_MODELS

function buildControlPrompt(input: {
  query: string
  brand: string
  competitors?: string[]
  topic?: string
}) {
  const competitors = input.competitors?.length ? input.competitors.join(', ') : 'none provided'

  return `${input.query}

Brand to check: ${input.brand}
Competitors to watch: ${competitors}
Topic: ${input.topic || 'not provided'}

Answer naturally as a buyer researching this market. Include useful sources when the model supports source-aware answers.`
}

function summarizeMentions(params: {
  text: string
  brand: string
  competitors?: string[]
  citations?: PerplexityCitation[]
}) {
  const citedUrls = Array.from(new Set([
    ...(params.citations || []).map(citation => citation.url),
    ...extractUrls(params.text),
  ]))
  const competitorMentions = Object.fromEntries(
    (params.competitors || []).map(competitor => [
      competitor,
      countMentions(params.text, competitor),
    ]),
  )

  return {
    brandMentioned: countMentions(params.text, params.brand) > 0,
    brandMentionCount: countMentions(params.text, params.brand),
    competitorMentions,
    citedUrls,
    citedDomains: extractDomains(citedUrls),
  }
}

export async function runGeoPerplexityDirectProbe(input: {
  query: string
  brand: string
  competitors?: string[]
  topic?: string
  recency?: 'month' | 'week' | 'day' | 'hour'
}) {
  const result = await searchWithPerplexity({
    query: buildControlPrompt(input),
    searchRecencyFilter: input.recency || 'month',
    returnCitations: true,
    model: 'sonar-pro',
  })

  return {
    success: result.success,
    provider: 'perplexity-api',
    model: 'sonar-pro',
    query: input.query,
    brand: input.brand,
    answer: result.answer,
    citations: result.citations,
    usage: result.usage,
    error: result.error,
    measurementRole: 'control',
    canonicalMeasurementTool: 'geo_brand_scan',
    ...summarizeMentions({
      text: result.answer,
      brand: input.brand,
      competitors: input.competitors,
      citations: result.citations,
    }),
  }
}

export async function runGeoGatewayControlProbe(input: {
  engine: GatewayControlEngine
  query: string
  brand: string
  competitors?: string[]
  topic?: string
}) {
  const modelId = GATEWAY_CONTROL_MODELS[input.engine]

  try {
    const result = await generateText({
      model: vercelGateway.languageModel(modelId),
      temperature: 0.2,
      prompt: buildControlPrompt(input),
      providerOptions: {
        gateway: {
          tags: ['feature:geo-control-probe', `engine:${input.engine}`],
        },
      },
    })

    return {
      success: true,
      provider: 'vercel-ai-gateway',
      engine: input.engine,
      model: modelId,
      query: input.query,
      brand: input.brand,
      answer: result.text,
      usage: result.usage,
      measurementRole: 'control',
      canonicalMeasurementTool: 'geo_brand_scan',
      ...summarizeMentions({
        text: result.text,
        brand: input.brand,
        competitors: input.competitors,
      }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vercel AI Gateway control probe failed'
    return {
      success: false,
      provider: 'vercel-ai-gateway',
      engine: input.engine,
      model: modelId,
      query: input.query,
      brand: input.brand,
      answer: '',
      citedUrls: [],
      citedDomains: [],
      error: message,
      measurementRole: 'control',
      canonicalMeasurementTool: 'geo_brand_scan',
    }
  }
}

export function createGeoPerplexityDirectProbeTool() {
  return tool({
    description:
      'Run a direct Perplexity API control probe with citations for GEO comparison. Use this to compare app-owned Perplexity output against the canonical AIsa/DataForSEO Perplexity measurement.',
    inputSchema: z.object({
      query: z.string().describe('The buyer-style question or AI search query to test'),
      brand: z.string().describe('The brand name to measure for mentions'),
      competitors: z.array(z.string()).optional().describe('Competitor brand names to count in the answer'),
      topic: z.string().optional().describe('Optional topic or product category context'),
      recency: z.enum(['month', 'week', 'day', 'hour']).optional().describe('Perplexity search recency filter'),
    }),
    execute: async ({ query, brand, competitors, topic, recency }) => {
      return runGeoPerplexityDirectProbe({ query, brand, competitors, topic, recency })
    },
  })
}

export function createGeoGatewayControlProbeTool() {
  return tool({
    description:
      'Run an app-owned Vercel AI Gateway control probe for GEO comparison. Use this for ChatGPT, Claude, Gemini, or Perplexity comparisons, not as the canonical DataForSEO measurement.',
    inputSchema: z.object({
      engine: z.enum(['chatgpt', 'claude', 'gemini', 'perplexity']).describe('Gateway model family to query'),
      query: z.string().describe('The buyer-style question or AI search query to test'),
      brand: z.string().describe('The brand name to measure for mentions'),
      competitors: z.array(z.string()).optional().describe('Competitor brand names to count in the answer'),
      topic: z.string().optional().describe('Optional topic or product category context'),
    }),
    execute: async ({ engine, query, brand, competitors, topic }) => {
      return runGeoGatewayControlProbe({ engine, query, brand, competitors, topic })
    },
  })
}

export function getGeoControlProbeTools() {
  return {
    geo_perplexity_direct_probe: createGeoPerplexityDirectProbeTool(),
    geo_gateway_control_probe: createGeoGatewayControlProbeTool(),
  }
}
