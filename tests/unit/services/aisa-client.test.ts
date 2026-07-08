import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockServerEnv } from '../../setup'
import {
  AisaApiError,
  chatGptDataForSeoProbe,
  backlinksList,
  backlinksSummary,
  getTwitterUserInfo,
  isAisaConfigured,
  normalizeAiProbeResult,
  normalizeBacklinkCollection,
  normalizeBacklinkSummary,
  normalizeDataForSeoResponse,
  normalizeGoogleAiOverviewResult,
  runChatGptMeasurementProbe,
} from '@/lib/services/aisa'
import type { DataForSeoResponse } from '@/lib/services/aisa'

describe('AIsa service layer', () => {
  beforeEach(() => {
    mockServerEnv.AISA_API_KEY = 'sk-aisa-test-key'
    mockServerEnv.AISA_BASE_URL = 'https://api.aisa.one'
    mockServerEnv.AISA_TIMEOUT_MS = 90000
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects whether AIsa is configured', () => {
    expect(isAisaConfigured()).toBe(true)
    mockServerEnv.AISA_API_KEY = undefined
    expect(isAisaConfigured()).toBe(false)
  })

  it('sends bearer auth and DataForSEO task arrays', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      status_code: 20000,
      status_message: 'Ok.',
      tasks_count: 1,
      tasks_error: 0,
      tasks: [],
    }), { status: 200 }))

    await chatGptDataForSeoProbe({
      userPrompt: 'What are the best AI SEO tools?',
      modelName: 'gpt-4o-mini',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.aisa.one/apis/v1/dataforseo/ai_optimization/chat_gpt/llm_responses/live',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-aisa-test-key',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify([{
          user_prompt: 'What are the best AI SEO tools?',
          model_name: 'gpt-4o-mini',
        }]),
      }),
    )
  })

  it('throws AisaApiError on non-OK responses', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid API key',
    }), { status: 401 }))

    await expect(getTwitterUserInfo({ userName: 'OpenAI' })).rejects.toMatchObject({
      status: 401,
      errorCode: 'Unauthorized',
    })
    await expect(getTwitterUserInfo({ userName: 'OpenAI' })).rejects.toBeInstanceOf(AisaApiError)
  })

  it('normalizes DataForSEO usage and task errors', () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      status_message: 'Ok.',
      cost: 0,
      tasks_count: 1,
      tasks_error: 1,
      tasks: [{
        id: 'task-1',
        status_code: 40501,
        status_message: "Invalid Field: 'model_name'.",
        cost: 0,
        result: null,
      }],
    }

    const normalized = normalizeDataForSeoResponse('/test', response)

    expect(normalized.ok).toBe(false)
    expect(normalized.firstError?.statusMessage).toContain('model_name')
    expect(normalized.usage).toMatchObject({
      provider: 'aisa',
      endpoint: '/test',
      tasksCount: 1,
      tasksError: 1,
      costUsd: 0,
      taskIds: ['task-1'],
    })
  })

  it('sends native backlink summary requests through AIsa/DataForSEO', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      status_code: 20000,
      status_message: 'Ok.',
      tasks_count: 1,
      tasks_error: 0,
      tasks: [],
    }), { status: 200 }))

    await backlinksSummary({ target: 'flowintent.com' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.aisa.one/apis/v1/dataforseo/backlinks/summary/live',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify([{ target: 'flowintent.com' }]),
      }),
    )
  })

  it('sends native backlink list requests with bounded limits', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      status_code: 20000,
      status_message: 'Ok.',
      tasks_count: 1,
      tasks_error: 0,
      tasks: [],
    }), { status: 200 }))

    await backlinksList({ target: 'flowintent.com', limit: 3 })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.aisa.one/apis/v1/dataforseo/backlinks/backlinks/live',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify([{ target: 'flowintent.com', limit: 3 }]),
      }),
    )
  })

  it('normalizes ChatGPT DataForSEO probe output as measurement evidence', async () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      status_message: 'Ok.',
      cost: 0.0008,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{
        id: 'probe-task',
        status_code: 20000,
        status_message: 'Ok.',
        cost: 0.0008,
        result_count: 1,
        result: [{
          model_name: 'gpt-4o-mini-2024-07-18',
          input_tokens: 26,
          output_tokens: 385,
          money_spent: 0.0002349,
          datetime: '2026-07-07 11:40:00 +00:00',
          items: [{
            type: 'message',
            sections: [{ type: 'text', text: 'Semrush and Surfer SEO are often mentioned.' }],
          }],
        }],
      }],
    }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))

    const normalized = await runChatGptMeasurementProbe({
      userPrompt: 'What are the best AI SEO tools?',
    })

    expect(normalized.ok).toBe(true)
    expect(normalized.probe?.modelName).toBe('gpt-4o-mini-2024-07-18')
    expect(normalized.probe?.responseText).toContain('Semrush')
    expect(normalized.usage.costUsd).toBe(0.0008)
  })

  it('normalizes DataForSEO message sections and annotations', () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      tasks: [{
        id: 'section-task',
        status_code: 20000,
        result: [{
          model_name: 'gemini-2.5-flash',
          message: {
            sections: [{
              type: 'text',
              text: 'FlowIntent appears in this answer.',
              annotations: [{ title: 'FlowIntent', url: 'https://flowintent.com/blog/geo' }],
            }],
          },
        }],
      }],
    }

    const normalized = normalizeAiProbeResult(response)

    expect(normalized?.responseText).toContain('FlowIntent')
    expect(normalized?.citedUrls).toEqual(['https://flowintent.com/blog/geo'])
    expect(normalized?.citedDomains).toEqual(['flowintent.com'])
  })

  it('normalizes Google AI Overview SERP blocks', () => {
    const response: DataForSeoResponse = {
      status_code: 20000,
      status_message: 'Ok.',
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{
        id: 'aio-task',
        status_code: 20000,
        status_message: 'Ok.',
        result: [{
          keyword: 'best ai seo tools',
          check_url: 'https://www.google.com/search?q=best%20ai%20seo%20tools',
          datetime: '2026-07-07 08:39:34 +00:00',
          item_types: ['ai_overview', 'organic'],
          items: [{
            type: 'ai_overview',
            markdown: 'The best AI SEO tools include Semrush One and Surfer SEO.',
            references: [
              { url: 'https://example.com/best-ai-seo-tools', title: 'Best AI SEO Tools' },
              { url: 'https://www.surferseo.com/blog/best-ai-seo-tools/' },
            ],
          }],
        }],
      }],
    }

    const normalized = normalizeGoogleAiOverviewResult(response)

    expect(normalized?.taskId).toBe('aio-task')
    expect(normalized?.markdown).toContain('Semrush')
    expect(normalized?.itemTypes).toContain('ai_overview')
    expect(normalized?.citedDomains).toEqual(['example.com', 'surferseo.com'])
  })

  it('normalizes backlink summary and backlink item collections', () => {
    const summaryResponse: DataForSeoResponse = {
      status_code: 20000,
      tasks: [{
        status_code: 20000,
        result: [{
          target: 'flowintent.com',
          backlinks: 19,
          referring_domains: 11,
          referring_pages: 18,
          referring_ips: 9,
          backlinks_spam_score: 32,
        }],
      }],
    }
    const listResponse: DataForSeoResponse = {
      status_code: 20000,
      tasks: [{
        status_code: 20000,
        result: [{
          target: 'flowintent.com',
          total_count: 19,
          items_count: 1,
          items: [{
            url_from: 'https://sites.example/share/1',
            url_to: 'https://flowintent.com/',
            domain_from: 'sites.example',
            domain_to: 'flowintent.com',
            anchor: 'FlowIntent',
            dofollow: false,
            backlink_spam_score: 50,
          }],
        }],
      }],
    }

    expect(normalizeBacklinkSummary(summaryResponse)).toMatchObject({
      target: 'flowintent.com',
      backlinks: 19,
      referringDomains: 11,
      spamScore: 32,
    })
    expect(normalizeBacklinkCollection(listResponse)?.items[0]).toMatchObject({
      sourceUrl: 'https://sites.example/share/1',
      targetUrl: 'https://flowintent.com/',
      sourceDomain: 'sites.example',
      anchorText: 'FlowIntent',
      linkType: 'nofollow',
      spamScore: 50,
    })
  })

  it('returns null when AI probe response has no result payload', () => {
    expect(normalizeAiProbeResult({ tasks: [{ result: null }] })).toBeNull()
  })
})
