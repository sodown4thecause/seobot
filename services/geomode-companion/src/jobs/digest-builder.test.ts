import { describe, expect, it } from 'vitest'
import { buildDailyDigest } from './digest-builder.js'

describe('buildDailyDigest', () => {
  it('builds a complete digest when geomode and serp data are present', () => {
    const digest = buildDailyDigest({
      date: '2026-06-18',
      brand: 'FlowIntent',
      windowHours: 24,
      geomode: {
        status: 'ok',
        engines: [{
          engine: 'chatgpt',
          mentionCount: 3,
          citationCount: 2,
          shareOfVoice: 42,
        }],
        citations: [{
          url: 'https://example.com/guide',
          domain: 'example.com',
          engines: ['chatgpt'],
          mentionsBrand: false,
        }],
      },
      serpSnapshots: [{
        keyword: 'ai visibility platform',
        domain: 'flowintent.com',
        rank: 8,
        previousRank: 12,
        rankDelta: 4,
        searchVolume: 1200,
        serpFeatures: ['people_also_ask'],
      }],
      previousSerpSnapshots: [{
        keyword: 'ai visibility platform',
        domain: 'flowintent.com',
        rank: 12,
        previousRank: null,
        searchVolume: 1200,
        serpFeatures: [],
      }],
    })

    expect(digest.degraded).toBe(false)
    expect(digest.geomode.status).toBe('ok')
    expect(digest.serp.rankMovers).toHaveLength(1)
    expect(digest.serp.serpFeatureChanges[0]?.added).toContain('people_also_ask')
  })

  it('marks degraded sections when geomode data is missing', () => {
    const digest = buildDailyDigest({
      date: '2026-06-18',
      brand: 'FlowIntent',
      windowHours: 24,
      geomode: {
        status: 'missing',
        engines: [],
        citations: [],
      },
      serpSnapshots: [],
    })

    expect(digest.degraded).toBe(true)
    expect(digest.degradedSections).toContain('geomode')
    expect(digest.degradedSections).toContain('serp')
  })
})
