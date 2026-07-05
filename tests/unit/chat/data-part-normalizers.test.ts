import { describe, it, expect } from 'vitest'
import {
  normalizeToolResultToDataParts,
  getDataBackedToolCallIds,
  buildLoadingDataPart,
} from '@/lib/chat/data-part-normalizers'

describe('data-part-normalizers', () => {
  it('maps pre-shaped keyword results to KeywordMetrics data part', () => {
    const parts = normalizeToolResultToDataParts({
      toolName: 'dataforseo_labs_google_keyword_ideas',
      result: {
        topic: 'coffee shop Brisbane',
        keywords: [
          {
            keyword: 'coffee shop brisbane',
            searchVolume: 2400,
            volume: 2400,
            difficulty: 38,
            cpc: 1.2,
            intent: 'commercial',
          },
        ],
      },
      mode: 'seo',
      toolCallId: 'call-1',
      topicHint: 'coffee shop Brisbane',
    })

    expect(parts.some((part) => part.type === 'data-KeywordMetrics')).toBe(true)
    const keywordPart = parts.find((part) => part.type === 'data-KeywordMetrics')
    expect(keywordPart?.id).toBe('tool-call-1-keywords')
    expect((keywordPart?.data as { keywords: unknown[] }).keywords).toHaveLength(1)
  })

  it('maps AEO citation analysis to CitationRecommendations and AIPlatformMetrics in geo mode', () => {
    const parts = normalizeToolResultToDataParts({
      toolName: 'aeo_analyze_citations',
      result: {
        topic: 'best coffee Brisbane',
        totalCitations: 12,
        topSources: [
          { domain: 'visitbrisbane.com.au', citationCount: 4, percentage: 33 },
          { domain: 'broadsheet.com.au', citationCount: 3, percentage: 25 },
        ],
        recommendations: ['Add local expert quotes', 'Publish structured FAQ blocks'],
      },
      mode: 'geo',
      toolCallId: 'call-geo-1',
      topicHint: 'best coffee Brisbane',
    })

    expect(parts.some((part) => part.type === 'data-CitationRecommendations')).toBe(true)
    expect(parts.some((part) => part.type === 'data-AIPlatformMetrics')).toBe(true)
  })

  it('maps SERP items to SerpResults data part', () => {
    const parts = normalizeToolResultToDataParts({
      toolName: 'serp_organic_live_advanced',
      result: [
        {
          result: [
            {
              items: [
                {
                  rank_group: 1,
                  title: 'Best Coffee in Brisbane',
                  url: 'https://example.com/best-coffee',
                  description: 'Guide to Brisbane coffee',
                },
              ],
            },
          ],
          tasks: [{ data: { keyword: 'coffee shop Brisbane' } }],
        },
      ],
      mode: 'seo',
      toolCallId: 'call-serp-1',
    })

    expect(parts.some((part) => part.type === 'data-SerpResults')).toBe(true)
    const serpPart = parts.find((part) => part.type === 'data-SerpResults')
    expect((serpPart?.data as { results: unknown[] }).results).toHaveLength(1)
  })

  it('extracts tool call ids covered by data parts', () => {
    const ids = getDataBackedToolCallIds([
      {
        type: 'data-KeywordMetrics',
        id: 'tool-call-9-keywords',
        data: { keywords: [], toolCallId: 'call-9', status: 'success' },
      },
    ])

    expect(ids.has('call-9')).toBe(true)
  })

  it('returns loading data part for keyword tools', () => {
    const loading = buildLoadingDataPart({
      toolName: 'dataforseo_labs_google_keyword_ideas',
      toolCallId: 'call-loading',
      mode: 'seo',
    })

    expect(loading?.type).toBe('data-KeywordMetrics')
    expect((loading?.data as { status?: string }).status).toBe('loading')
  })
})
