import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getGeoControlProbeTools,
  runGeoGatewayControlProbe,
  runGeoPerplexityDirectProbe,
} from '@/lib/geo/control-probes'

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
  languageModel: vi.fn((modelId: string) => `gateway:${modelId}`),
  searchWithPerplexity: vi.fn(),
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    generateText: mocks.generateText,
  }
})

vi.mock('@/lib/ai/gateway-provider', () => ({
  vercelGateway: {
    languageModel: mocks.languageModel,
  },
}))

vi.mock('@/lib/external-apis/perplexity', () => ({
  searchWithPerplexity: mocks.searchWithPerplexity,
}))

describe('GEO control probes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs direct Perplexity controls with citations and mention counts', async () => {
    mocks.searchWithPerplexity.mockResolvedValue({
      success: true,
      answer: 'FlowIntent and Ahrefs are both visible in AI SEO research.',
      citations: [{ url: 'https://flowintent.com/geo', domain: 'flowintent.com' }],
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    })

    const result = await runGeoPerplexityDirectProbe({
      query: 'best AI SEO tools',
      brand: 'FlowIntent',
      competitors: ['Ahrefs'],
      topic: 'GEO',
      recency: 'week',
    })

    expect(mocks.searchWithPerplexity).toHaveBeenCalledWith(expect.objectContaining({
      searchRecencyFilter: 'week',
      returnCitations: true,
      model: 'sonar-pro',
    }))
    expect(result.provider).toBe('perplexity-api')
    expect(result.measurementRole).toBe('control')
    expect(result.canonicalMeasurementTool).toBe('geo_brand_scan')
    expect(result.brandMentioned).toBe(true)
    expect(result.competitorMentions).toEqual({ Ahrefs: 1 })
    expect(result.citedDomains).toEqual(['flowintent.com'])
  })

  it('runs Gateway controls through the configured model map', async () => {
    mocks.generateText.mockResolvedValue({
      text: 'FlowIntent appears in this comparison next to Semrush. https://example.com/source',
      usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
    })

    const result = await runGeoGatewayControlProbe({
      engine: 'chatgpt',
      query: 'best AI SEO tools',
      brand: 'FlowIntent',
      competitors: ['Semrush'],
    })

    expect(mocks.languageModel).toHaveBeenCalledWith('openai/gpt-5.5')
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gateway:openai/gpt-5.5',
      temperature: 0.2,
      providerOptions: {
        gateway: {
          tags: ['feature:geo-control-probe', 'engine:chatgpt'],
        },
      },
    }))
    expect(result.provider).toBe('vercel-ai-gateway')
    expect(result.brandMentioned).toBe(true)
    expect(result.citedDomains).toEqual(['example.com'])
  })

  it('returns structured Gateway errors without throwing', async () => {
    mocks.generateText.mockRejectedValue(new Error('Gateway unavailable'))

    const result = await runGeoGatewayControlProbe({
      engine: 'gemini',
      query: 'best GEO tools',
      brand: 'FlowIntent',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Gateway unavailable')
    expect(result.model).toBe('google/gemini-3.0-pro')
  })

  it('exports both control tools for GEO mode', () => {
    const tools = getGeoControlProbeTools()

    expect(Object.keys(tools).sort()).toEqual([
      'geo_gateway_control_probe',
      'geo_perplexity_direct_probe',
    ])
  })
})
