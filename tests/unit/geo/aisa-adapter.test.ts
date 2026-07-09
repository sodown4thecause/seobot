import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runAisaGeoPrompt } from '@/lib/geo/aisa-adapter'
import type { DataForSeoResponse } from '@/lib/services/aisa'

const aisaMocks = vi.hoisted(() => ({
  isAisaConfigured: vi.fn(),
  aiOptimizationLlmResponseProbe: vi.fn(),
  googleAiOverviewSerp: vi.fn(),
}))

vi.mock('@/lib/services/aisa', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/aisa')>()
  return {
    ...actual,
    isAisaConfigured: aisaMocks.isAisaConfigured,
    aiOptimizationLlmResponseProbe: aisaMocks.aiOptimizationLlmResponseProbe,
    googleAiOverviewSerp: aisaMocks.googleAiOverviewSerp,
  }
})

describe('AIsa GEO adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aisaMocks.isAisaConfigured.mockReturnValue(true)
  })

  it('returns not_configured when AIsa credentials are missing', async () => {
    aisaMocks.isAisaConfigured.mockReturnValue(false)

    const result = await runAisaGeoPrompt('chatgpt', {
      prompt: 'best AI SEO tools',
      brand: 'FlowIntent',
    })

    expect(result.status).toBe('not_configured')
    expect(result.error).toContain('AIsa API key')
    expect(aisaMocks.aiOptimizationLlmResponseProbe).not.toHaveBeenCalled()
  })

  it('runs ChatGPT visibility probes through AIsa/DataForSEO', async () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      status_message: 'Ok.',
      cost: 0.001,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{
        id: 'chatgpt-task',
        status_code: 20000,
        status_message: 'Ok.',
        cost: 0.001,
        result: [{
          model_name: 'gpt-4o-mini',
          message: {
            sections: [{
              text: 'FlowIntent is cited alongside Ahrefs for GEO workflows.',
              annotations: [{ url: 'https://flowintent.com/geo' }],
            }],
          },
        }],
      }],
    }
    aisaMocks.aiOptimizationLlmResponseProbe.mockResolvedValue(response)

    const result = await runAisaGeoPrompt('chatgpt', {
      prompt: 'best AI SEO tools',
      brand: 'FlowIntent',
      competitors: ['Ahrefs'],
      topic: 'GEO',
    })

    expect(aisaMocks.aiOptimizationLlmResponseProbe).toHaveBeenCalledWith(expect.objectContaining({
      engine: 'chat_gpt',
      modelName: 'gpt-4o-mini',
      webSearch: true,
      forceWebSearch: true,
    }))
    expect(result.status).toBe('completed')
    expect(result.responseText).toContain('FlowIntent')
    expect(result.citedUrls).toEqual(['https://flowintent.com/geo'])
    expect(result.citedDomains).toEqual(['flowintent.com'])
  })

  it('maps Gemini, Claude, and Perplexity to their AIsa AI Optimization endpoints', async () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      tasks_error: 0,
      tasks: [{
        status_code: 20000,
        result: [{ message: { sections: [{ text: 'No brand mention.' }] } }],
      }],
    }
    aisaMocks.aiOptimizationLlmResponseProbe.mockResolvedValue(response)

    await runAisaGeoPrompt('gemini', { prompt: 'query', brand: 'FlowIntent' })
    await runAisaGeoPrompt('claude', { prompt: 'query', brand: 'FlowIntent' })
    await runAisaGeoPrompt('perplexity', { prompt: 'query', brand: 'FlowIntent' })

    expect(aisaMocks.aiOptimizationLlmResponseProbe).toHaveBeenNthCalledWith(1, expect.objectContaining({
      engine: 'gemini',
      modelName: 'gemini-2.5-flash',
    }))
    expect(aisaMocks.aiOptimizationLlmResponseProbe).toHaveBeenNthCalledWith(2, expect.objectContaining({
      engine: 'claude',
      modelName: 'claude-haiku-4-5-20251001',
    }))
    expect(aisaMocks.aiOptimizationLlmResponseProbe).toHaveBeenNthCalledWith(3, expect.objectContaining({
      engine: 'perplexity',
      modelName: 'sonar',
    }))
  })

  it('runs Google AI Overview probes through AIsa/DataForSEO SERP', async () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      status_message: 'Ok.',
      tasks_error: 0,
      tasks: [{
        id: 'aio-task',
        status_code: 20000,
        result: [{
          keyword: 'best AI SEO tools',
          item_types: ['ai_overview', 'organic'],
          items: [{
            type: 'ai_overview',
            markdown: 'FlowIntent appears in this AI Overview.',
            references: [{ url: 'https://flowintent.com/' }],
          }],
        }],
      }],
    }
    aisaMocks.googleAiOverviewSerp.mockResolvedValue(response)

    const result = await runAisaGeoPrompt('google_ai_overview', {
      prompt: 'best AI SEO tools',
      brand: 'FlowIntent',
    })

    expect(aisaMocks.googleAiOverviewSerp).toHaveBeenCalledWith({ keyword: 'best AI SEO tools' })
    expect(aisaMocks.aiOptimizationLlmResponseProbe).not.toHaveBeenCalled()
    expect(result.status).toBe('completed')
    expect(result.responseText).toContain('AI Overview')
    expect(result.citedDomains).toEqual(['flowintent.com'])
  })

  it('returns error results for DataForSEO task failures', async () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      tasks_error: 1,
      tasks: [{
        status_code: 40501,
        status_message: "Invalid Field: 'model_name'.",
        result: null,
      }],
    }
    aisaMocks.aiOptimizationLlmResponseProbe.mockResolvedValue(response)

    const result = await runAisaGeoPrompt('claude', {
      prompt: 'best AI SEO tools',
      brand: 'FlowIntent',
    })

    expect(result.status).toBe('error')
    expect(result.error).toContain('model_name')
  })
})
