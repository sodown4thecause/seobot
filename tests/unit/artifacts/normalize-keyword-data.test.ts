import { describe, expect, it } from 'vitest'
import { normalizeKeywordArtifactData } from '@/lib/artifacts/normalize-keyword-data'

describe('normalizeKeywordArtifactData', () => {
  it('passes through pre-normalized keyword payloads', () => {
    const data = normalizeKeywordArtifactData({
      topic: 'candle gifts',
      keywords: [{ keyword: 'candle gifts', volume: 1000, difficulty: 35, cpc: 1.2, intent: 'commercial' }],
    })

    expect(data?.topic).toBe('candle gifts')
    expect(data?.keywords).toHaveLength(1)
    expect(data?.keywords[0]).toMatchObject({ keyword: 'candle gifts', volume: 1000 })
  })

  it('normalizes raw DataForSEO Labs task structures', () => {
    const raw = {
      tasks: [
        {
          result: [
            {
              items: [
                {
                  keyword_data: {
                    keyword: 'best candle gifts',
                    keyword_info: { search_volume: 880, cpc: 0.9 },
                    keyword_properties: { keyword_difficulty: 42 },
                    search_intent_info: { main_intent: 'commercial' },
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    const data = normalizeKeywordArtifactData(raw)
    expect(data?.keywords).toHaveLength(1)
    expect(data?.keywords[0]).toEqual({
      keyword: 'best candle gifts',
      volume: 880,
      difficulty: 42,
      cpc: 0.9,
      intent: 'commercial',
    })
  })

  it('parses JSON strings', () => {
    const data = normalizeKeywordArtifactData(
      JSON.stringify({ items: [{ keyword: 'soy candles', search_volume: 500 }] })
    )
    expect(data?.keywords[0]).toMatchObject({ keyword: 'soy candles', volume: 500 })
  })

  it('returns null for unusable payloads', () => {
    expect(normalizeKeywordArtifactData(null)).toBeNull()
    expect(normalizeKeywordArtifactData('plain text response')).toBeNull()
    expect(normalizeKeywordArtifactData({ status: 'error' })).toBeNull()
  })
})
