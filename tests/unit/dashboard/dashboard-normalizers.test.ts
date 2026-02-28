import { describe, expect, it } from 'vitest'
import { normalizeWebsiteAuditPayload } from '@/lib/dashboard/normalizers/website-audit'
import { normalizeRankTrackerPayload } from '@/lib/dashboard/normalizers/rank-tracker'

describe('dashboard normalizers', () => {
  describe('normalizeWebsiteAuditPayload', () => {
    it('handles missing provider payloads with partial status', () => {
      const result = normalizeWebsiteAuditPayload({
        providers: {
          lighthouse: {
            score: 88,
            issues: [{ severity: 'critical', title: 'Missing title tag' }],
          },
        },
      })

      expect(result.providerStatus.overall).toBe('partial')
      expect(result.providerStatus.providers.lighthouse).toBe('ok')
      expect(result.providerStatus.providers.dataforseo).toBe('failed')
      expect(result.providerStatus.providers.firecrawl).toBe('failed')
      expect(result.summary.healthScore).toBe(88)
      expect(result.summary.issuesBySeverity.critical).toBe(1)
    })

    it('clamps provider scores and falls back issue severity to warning', () => {
      const result = normalizeWebsiteAuditPayload({
        providers: {
          lighthouse: {
            score: 140,
            issues: [
              { severity: 'critical', title: 'Broken canonical' },
              { severity: 'unexpected', title: 'No structured data' },
              { severity: 'info', title: '   ' },
            ],
          },
          dataforseo: {
            score: -12,
          },
          firecrawl: {
            score: 50,
          },
        },
      })

      expect(result.summary.healthScore).toBe(50)
      expect(result.summary.issuesBySeverity).toEqual({
        critical: 1,
        warning: 1,
        info: 0,
      })
      expect(result.issues).toEqual([
        {
          title: 'Broken canonical',
          severity: 'critical',
          sourceProvider: 'lighthouse',
        },
        {
          title: 'No structured data',
          severity: 'warning',
          sourceProvider: 'lighthouse',
        },
      ])
    })
  })

  describe('normalizeRankTrackerPayload', () => {
    it('returns deterministic defaults with winners and losers buckets for empty input', () => {
      const result = normalizeRankTrackerPayload(undefined)

      expect(result.providerStatus.overall).toBe('failed')
      expect(result.summary.trackedKeywords).toBe(0)
      expect(result.summary.averagePosition).toBe(0)
      expect(result.summary.visibility).toBe(0)
      expect(result.movements.winners).toEqual({ count: 0, keywords: [] })
      expect(result.movements.losers).toEqual({ count: 0, keywords: [] })
      expect(result.movements.unchanged).toEqual({ count: 0, keywords: [] })
      expect(result.keywords).toEqual([])
    })

    it('sorts keywords deterministically independent of runtime locale', () => {
      const result = normalizeRankTrackerPayload({
        keywords: [
          { keyword: 'banana', currentPosition: 3 },
          { keyword: 'apple', currentPosition: 1 },
          { keyword: 'Zebra', currentPosition: 2 },
          { keyword: 'alpha', currentPosition: 4 },
        ],
      })

      expect(result.keywords.map((entry) => entry.keyword)).toEqual(['alpha', 'apple', 'banana', 'Zebra'])
    })

    it('sanitizes invalid and decimal positions before aggregates and buckets', () => {
      const result = normalizeRankTrackerPayload({
        keywords: [
          { keyword: 'good-top-10', currentPosition: 1.9, previousPosition: 6.5 },
          { keyword: 'negative-position', currentPosition: -5, previousPosition: 2 },
          { keyword: 'invalid-position', currentPosition: 'n/a', previousPosition: 4 },
        ],
      })

      expect(result.keywords).toEqual([
        { keyword: 'good-top-10', currentPosition: 1, previousPosition: 6, change: 5 },
        { keyword: 'invalid-position', currentPosition: 0, previousPosition: 4, change: 0 },
        { keyword: 'negative-position', currentPosition: 0, previousPosition: 2, change: 0 },
      ])
      expect(result.summary.averagePosition).toBe(0.33)
      expect(result.summary.visibility).toBe(33.33)
      expect(result.movements.winners.keywords.map((entry) => entry.keyword)).toEqual(['good-top-10'])
      expect(result.movements.unchanged.keywords.map((entry) => entry.keyword)).toEqual([
        'invalid-position',
        'negative-position',
      ])
    })
  })
})
