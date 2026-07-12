import { describe, expect, it } from 'vitest'
import { normalizeKeywordArtifactData } from '@/lib/artifacts/normalize-keyword-data'

describe('normalizeKeywordArtifactData', () => {
  it('preserves an empty keyword artifact as a renderable shape', () => {
    expect(normalizeKeywordArtifactData({ topic: 'No matches', keywords: [] })).toEqual({
      topic: 'No matches',
      keywords: [],
    })
  })

  it('normalizes nested DataForSEO keyword rows', () => {
    const normalized = normalizeKeywordArtifactData({ tasks: [{ result: [{ items: [{
      keyword_data: {
        keyword: 'candle gifts',
        keyword_info: { search_volume: 880, cpc: 0.9 },
        keyword_properties: { keyword_difficulty: 42 },
        search_intent_info: { main_intent: 'commercial' },
      },
    }] }] }] })

    expect(normalized).toEqual({
      topic: 'Keyword Analysis',
      keywords: [{
        keyword: 'candle gifts',
        volume: 880,
        difficulty: 42,
        cpc: 0.9,
        intent: 'commercial',
      }],
    })
  })

  it('rejects unusable payloads', () => {
    expect(normalizeKeywordArtifactData(null)).toBeNull()
    expect(normalizeKeywordArtifactData('plain text')).toBeNull()
  })
})
