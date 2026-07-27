import { describe, expect, it } from 'vitest'
import { normalizeKeywordToolResult } from '@/lib/chat/tool-result-normalizers'

// Helpers
const kw = (overrides = {}) => ({
  keyword: 'seo tools',
  volume: 1000,
  difficulty: 40,
  cpc: 2.5,
  intent: 'commercial',
  ...overrides,
})

describe('normalizeKeywordToolResult', () => {
  describe('basic keyword array', () => {
    it('normalizes a flat array of keyword objects', () => {
      const result = normalizeKeywordToolResult([kw()])
      expect(result.keywords).toHaveLength(1)
      expect(result.keywords[0]).toMatchObject({
        keyword: 'seo tools',
        volume: 1000,
        difficulty: 40,
        cpc: 2.5,
        intent: 'commercial',
      })
    })

    it('uses default topic when not provided', () => {
      const result = normalizeKeywordToolResult([kw()])
      expect(result.topic).toBe('Keyword Analysis')
    })

    it('filters out keyword rows without a keyword string', () => {
      const result = normalizeKeywordToolResult([kw(), { volume: 500 }])
      expect(result.keywords).toHaveLength(1)
    })
  })

  describe('wrapped payload shapes', () => {
    it('unwraps { success, data } wrapper', () => {
      const payload = { success: true, data: [kw()] }
      const result = normalizeKeywordToolResult(payload)
      expect(result.keywords).toHaveLength(1)
    })

    it('extracts keywords from { keywords: [...] }', () => {
      const payload = { keywords: [kw(), kw({ keyword: 'link building' })] }
      const result = normalizeKeywordToolResult(payload)
      expect(result.keywords).toHaveLength(2)
    })

    it('extracts keywords from { items: [...] }', () => {
      const payload = { items: [kw()] }
      const result = normalizeKeywordToolResult(payload)
      expect(result.keywords).toHaveLength(1)
    })

    it('extracts keywords from { result: [...] } containing nested keyword arrays', () => {
      // result[] items must themselves have a keywords/items array; plain keyword rows inside
      // result[] are not extracted (the normalizer treats result[] as a DataForSEO task list).
      const payload = { result: [{ keywords: [kw()] }] }
      const result = normalizeKeywordToolResult(payload)
      expect(result.keywords).toHaveLength(1)
    })

    it('extracts keywords from tasks array', () => {
      const payload = {
        tasks: [{ result: [kw()] }, { result: [kw({ keyword: 'content gap' })] }],
      }
      const result = normalizeKeywordToolResult(payload)
      expect(result.keywords).toHaveLength(2)
    })

    it('reads topic from top-level topic field', () => {
      const payload = { topic: 'AI SEO Tools', keywords: [kw()] }
      const result = normalizeKeywordToolResult(payload)
      expect(result.topic).toBe('AI SEO Tools')
    })

    it('ignores empty topic string', () => {
      const payload = { topic: '  ', keywords: [kw()] }
      const result = normalizeKeywordToolResult(payload)
      expect(result.topic).toBe('Keyword Analysis')
    })
  })

  describe('alternative field names', () => {
    it('reads keyword from term field', () => {
      const row = { term: 'link building', volume: 500, difficulty: 30, cpc: 1.2, intent: 'informational' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].keyword).toBe('link building')
    })

    it('reads keyword from query field', () => {
      const row = { query: 'aeo optimization', volume: 200, difficulty: 20, cpc: 0.8, intent: 'informational' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].keyword).toBe('aeo optimization')
    })

    it('reads volume from search_volume', () => {
      const row = { keyword: 'test', search_volume: 7500 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].volume).toBe(7500)
    })

    it('reads volume from searchVolume (camelCase)', () => {
      const row = { keyword: 'test', searchVolume: 3200 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].volume).toBe(3200)
    })

    it('reads volume from monthly_searches', () => {
      const row = { keyword: 'test', monthly_searches: 9900 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].volume).toBe(9900)
    })

    it('reads difficulty from keyword_difficulty', () => {
      const row = { keyword: 'test', keyword_difficulty: 55 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].difficulty).toBe(55)
    })

    it('reads difficulty from competition', () => {
      const row = { keyword: 'test', competition: 70 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].difficulty).toBe(70)
    })

    it('reads difficulty from competition_index', () => {
      const row = { keyword: 'test', competition_index: 45 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].difficulty).toBe(45)
    })

    it('reads cpc from cost_per_click', () => {
      const row = { keyword: 'test', cost_per_click: 3.14 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].cpc).toBeCloseTo(3.14, 5)
    })

    it('reads cpc from avg_cpc', () => {
      const row = { keyword: 'test', avg_cpc: 1.99 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].cpc).toBeCloseTo(1.99, 5)
    })

    it('reads cpc from low_top_of_page_bid', () => {
      const row = { keyword: 'test', low_top_of_page_bid: 0.75 }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].cpc).toBeCloseTo(0.75, 5)
    })

    it('reads intent from search_intent', () => {
      const row = { keyword: 'test', search_intent: 'navigational' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].intent).toBe('navigational')
    })

    it('reads intent from searchIntent (camelCase)', () => {
      const row = { keyword: 'test', searchIntent: 'transactional' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].intent).toBe('transactional')
    })

    it('falls back to Unknown when intent is missing', () => {
      const row = { keyword: 'test' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].intent).toBe('Unknown')
    })
  })

  describe('numeric coercions', () => {
    it('converts string numbers (e.g., "1,200") for volume', () => {
      const row = { keyword: 'test', volume: '1200' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].volume).toBe(1200)
    })

    it('strips currency symbols from CPC strings', () => {
      const row = { keyword: 'test', cpc: '$2.50' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].cpc).toBeCloseTo(2.5, 5)
    })

    it('strips percent signs from difficulty strings', () => {
      const row = { keyword: 'test', difficulty: '65%' }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].difficulty).toBe(65)
    })

    it('clamps difficulty to [0, 100]', () => {
      const low = normalizeKeywordToolResult([{ keyword: 'test', difficulty: -10 }])
      const high = normalizeKeywordToolResult([{ keyword: 'test', difficulty: 150 }])
      expect(low.keywords[0].difficulty).toBe(0)
      expect(high.keywords[0].difficulty).toBe(100)
    })

    it('returns 0 for NaN-ish values', () => {
      const row = { keyword: 'test', volume: 'N/A', difficulty: null, cpc: undefined }
      const result = normalizeKeywordToolResult([row])
      expect(result.keywords[0].volume).toBe(0)
      expect(result.keywords[0].difficulty).toBe(0)
      expect(result.keywords[0].cpc).toBe(0)
    })
  })

  describe('JSON string inputs', () => {
    it('parses a JSON-encoded array string', () => {
      const json = JSON.stringify([kw()])
      const result = normalizeKeywordToolResult(json)
      expect(result.keywords).toHaveLength(1)
      expect(result.keywords[0].keyword).toBe('seo tools')
    })

    it('parses a JSON-encoded object with keywords array', () => {
      const json = JSON.stringify({ topic: 'Parsed Topic', keywords: [kw()] })
      const result = normalizeKeywordToolResult(json)
      expect(result.topic).toBe('Parsed Topic')
      expect(result.keywords).toHaveLength(1)
    })

    it('returns empty keywords for non-JSON string', () => {
      const result = normalizeKeywordToolResult('just a plain string')
      expect(result.keywords).toHaveLength(0)
    })

    it('multiline strings starting with { fall back to empty when JSON.parse fails', () => {
      // parseJsonString tries JSON.parse first (because the string starts with {).
      // Two concatenated JSON objects is not valid JSON, so it returns null.
      // The string is then treated as unparseable, yielding no keywords.
      const multiline = `${JSON.stringify(kw())}\n${JSON.stringify(kw({ keyword: 'second kw' }))}`
      const result = normalizeKeywordToolResult(multiline)
      expect(result.keywords).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('returns default when given null', () => {
      const result = normalizeKeywordToolResult(null)
      expect(result.keywords).toHaveLength(0)
      expect(result.topic).toBe('Keyword Analysis')
    })

    it('returns default when given undefined', () => {
      const result = normalizeKeywordToolResult(undefined)
      expect(result.keywords).toHaveLength(0)
    })

    it('returns default when given an empty array', () => {
      const result = normalizeKeywordToolResult([])
      expect(result.keywords).toHaveLength(0)
    })

    it('returns default when given an empty object', () => {
      const result = normalizeKeywordToolResult({})
      expect(result.keywords).toHaveLength(0)
    })

    it('handles deeply nested arrays (flattening)', () => {
      const payload = [[kw()], [kw({ keyword: 'deep kw' })]]
      const result = normalizeKeywordToolResult(payload)
      expect(result.keywords.length).toBeGreaterThanOrEqual(1)
    })

    it('does not include null rows in output', () => {
      const payload = [kw(), null, kw({ keyword: 'valid' })]
      const result = normalizeKeywordToolResult(payload)
      const keywords = result.keywords.map((k) => k.keyword)
      expect(keywords).not.toContain(null)
    })
  })
})
