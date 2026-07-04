import { describe, expect, it } from 'vitest'
import {
  geoSuggestionsSchema,
  dailyDigestDocumentSchema,
} from '@/lib/geo/digest-types'

describe('geo suggestion contract', () => {
  it('accepts a valid suggestions payload', () => {
    const parsed = geoSuggestionsSchema.parse({
      generatedAt: new Date().toISOString(),
      model: 'openai/gpt-5.5',
      actions: [{
        priority: 1,
        title: 'Pitch example.com for a niche citation',
        rationale: 'ChatGPT cited example.com in 4 prompts where FlowIntent was absent.',
        evidence: ['Digest geomode citations include example.com x4'],
      }],
      longTermLinks: [{
        url: 'https://example.com/guide',
        domain: 'example.com',
        reason: 'Trusted source in niche without brand mention yet',
        citedByEngines: ['chatgpt', 'perplexity'],
      }],
    })

    expect(parsed.actions).toHaveLength(1)
  })

  it('rejects more than five actions', () => {
    expect(() => geoSuggestionsSchema.parse({
      generatedAt: new Date().toISOString(),
      model: 'openai/gpt-5.5',
      actions: Array.from({ length: 6 }, (_, index) => ({
        priority: index + 1,
        title: `Action ${index + 1}`,
        rationale: 'Because the digest shows evidence.',
        evidence: ['Evidence line'],
      })),
      longTermLinks: [],
    })).toThrow()
  })

  it('parses a minimal digest document fixture', () => {
    const digest = dailyDigestDocumentSchema.parse({
      date: '2026-06-18',
      brand: 'FlowIntent',
      generatedAt: new Date().toISOString(),
      degraded: true,
      degradedSections: ['geomode'],
      geomode: {
        status: 'missing',
        windowHours: 24,
        engines: [],
        citations: [],
      },
      serp: {
        status: 'ok',
        keywords: [],
        rankMovers: [],
        serpFeatureChanges: [],
      },
    })

    expect(digest.degradedSections).toEqual(['geomode'])
  })
})
