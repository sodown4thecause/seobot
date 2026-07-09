import { describe, it, expect } from 'vitest'
import {
    computeRecencyBoost,
    computeHybridScore,
    rerankByHybridScore,
    SOURCE_TIER_BOOST,
    RECENCY_BOOST_MAX,
    RECENCY_HALFLIFE_DAYS,
} from '@/lib/db/hybrid-rerank'

const DAY_MS = 1000 * 60 * 60 * 24

function daysAgo(days: number): Date {
    return new Date(Date.now() - days * DAY_MS)
}

describe('computeRecencyBoost', () => {
    it('returns 0 for a null createdAt', () => {
        expect(computeRecencyBoost(null)).toBe(0)
    })

    it('returns the max boost (~0.1) for a freshly created document', () => {
        const boost = computeRecencyBoost(new Date())
        expect(boost).toBeCloseTo(RECENCY_BOOST_MAX, 5)
    })

    it('returns ~0.037 for a 30-day-old document (one half-life)', () => {
        const boost = computeRecencyBoost(daysAgo(30))
        expect(boost).toBeCloseTo(RECENCY_BOOST_MAX * Math.exp(-1), 5)
    })

    it('returns ~0.005 for a 90-day-old document (three half-lives)', () => {
        const boost = computeRecencyBoost(daysAgo(90))
        expect(boost).toBeCloseTo(RECENCY_BOOST_MAX * Math.exp(-3), 5)
    })

    it('returns the max boost for a future-dated document', () => {
        const boost = computeRecencyBoost(new Date(Date.now() + DAY_MS))
        expect(boost).toBe(RECENCY_BOOST_MAX)
    })

    it('decays monotonically with age', () => {
        const fresh = computeRecencyBoost(daysAgo(1))
        const mid = computeRecencyBoost(daysAgo(30))
        const old = computeRecencyBoost(daysAgo(90))
        expect(fresh).toBeGreaterThan(mid)
        expect(mid).toBeGreaterThan(old)
    })

    it('respects a custom half-life', () => {
        const boost = computeRecencyBoost(daysAgo(60), 60)
        expect(boost).toBeCloseTo(RECENCY_BOOST_MAX * Math.exp(-1), 5)
    })
})

describe('computeHybridScore', () => {
    it('returns plain similarity when no recency and no source tier', () => {
        expect(computeHybridScore(0.8, null, null)).toBe(0.8)
        expect(computeHybridScore(0.8, null, 'general')).toBe(0.8)
    })

    it('boosts a search_console source higher than a general source at equal similarity/recency', () => {
        const now = new Date()
        const sc = computeHybridScore(0.7, now, 'search_console')
        const general = computeHybridScore(0.7, now, 'general')
        expect(sc).toBeGreaterThan(general)
        expect(sc - general).toBeCloseTo(SOURCE_TIER_BOOST.search_console, 5)
    })

    it('applies tier boosts in descending authority order', () => {
        const now = new Date()
        const scores = {
            search_console: computeHybridScore(0.5, now, 'search_console'),
            fortnightly_industry_research: computeHybridScore(0.5, now, 'fortnightly_industry_research'),
            fortnightly_source_page: computeHybridScore(0.5, now, 'fortnightly_source_page'),
            brand_voice: computeHybridScore(0.5, now, 'brand_voice'),
            onboarding: computeHybridScore(0.5, now, 'onboarding'),
            general: computeHybridScore(0.5, now, 'general'),
        }
        expect(scores.search_console).toBeGreaterThan(scores.fortnightly_industry_research)
        expect(scores.fortnightly_industry_research).toBeGreaterThan(scores.fortnightly_source_page)
        expect(scores.fortnightly_source_page).toBeGreaterThan(scores.brand_voice)
        expect(scores.brand_voice).toBeGreaterThan(scores.onboarding)
        expect(scores.onboarding).toBeGreaterThan(scores.general)
    })

    it('combines similarity, recency, and tier additively', () => {
        const createdAt = daysAgo(30)
        const similarity = 0.6
        const expected =
            similarity +
            RECENCY_BOOST_MAX * Math.exp(-30 / RECENCY_HALFLIFE_DAYS) +
            SOURCE_TIER_BOOST.search_console
        expect(computeHybridScore(similarity, createdAt, 'search_console')).toBeCloseTo(expected, 5)
    })
})

describe('rerankByHybridScore', () => {
    it('sorts results by hybrid score descending', () => {
        const results = [
            { id: 'a', similarity: 0.5, sourceType: 'general', createdAt: daysAgo(90) },
            { id: 'b', similarity: 0.4, sourceType: 'search_console', createdAt: new Date() },
            { id: 'c', similarity: 0.45, sourceType: 'fortnightly_industry_research', createdAt: daysAgo(30) },
        ]
        const ranked = rerankByHybridScore(results, item => item.createdAt)
        const scores = ranked.map(r => r.hybridScore)
        expect(scores).toEqual([...scores].sort((a, b) => b - a))
        expect(ranked[0].id).toBe('b')
    })

    it('adds a hybridScore field to every result', () => {
        const results = [
            { id: 'a', similarity: 0.5, sourceType: 'general', createdAt: null },
        ]
        const ranked = rerankByHybridScore(results, item => item.createdAt)
        expect(ranked[0]).toHaveProperty('hybridScore')
        expect(typeof ranked[0].hybridScore).toBe('number')
    })

    it('preserves all original fields on each result', () => {
        const results = [
            { id: 'a', similarity: 0.5, sourceType: 'general', createdAt: null, extra: 'keep' },
        ]
        const ranked = rerankByHybridScore(results, item => item.createdAt)
        expect(ranked[0].id).toBe('a')
        expect(ranked[0].extra).toBe('keep')
    })

    it('lets a lower-similarity, recent, high-tier doc outrank a higher-similarity, old, low-tier doc', () => {
        const results = [
            {
                id: 'old-general',
                similarity: 0.9,
                sourceType: 'general',
                createdAt: daysAgo(90),
            },
            {
                id: 'fresh-sc',
                similarity: 0.82,
                sourceType: 'search_console',
                createdAt: new Date(),
            },
        ]
        const ranked = rerankByHybridScore(results, item => item.createdAt)
        expect(ranked[0].id).toBe('fresh-sc')
        expect(ranked[0].similarity).toBeLessThan(ranked[1].similarity)
        expect(ranked[0].hybridScore).toBeGreaterThan(ranked[1].hybridScore)
    })

    it('returns an empty array unchanged', () => {
        const ranked = rerankByHybridScore([], () => null)
        expect(ranked).toEqual([])
    })

    it('falls back to similarity order when recency and tiers are equal', () => {
        const results = [
            { id: 'low', similarity: 0.4, sourceType: 'general', createdAt: null },
            { id: 'high', similarity: 0.9, sourceType: 'general', createdAt: null },
            { id: 'mid', similarity: 0.6, sourceType: 'general', createdAt: null },
        ]
        const ranked = rerankByHybridScore(results, item => item.createdAt)
        expect(ranked.map(r => r.id)).toEqual(['high', 'mid', 'low'])
    })
})
