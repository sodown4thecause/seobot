import { describe, expect, it } from 'vitest'
import { buildBuyerIntentPrompts } from '@/lib/audit/prompts'
import { parsePlatformResponse } from '@/lib/audit/parser'
import { computeAuditResults } from '@/lib/audit/scorer'
import type { BrandDetectionPayload } from '@/lib/audit/types'

const context: BrandDetectionPayload = {
  brand: 'Flow Intent',
  category: 'SEO software',
  icp: 'marketing teams',
  competitors: ['Semrush', 'Ahrefs'],
  vertical: 'Digital Marketing',
}

describe('AI visibility audit utilities', () => {
  it('builds exactly three buyer-intent prompts', () => {
    const prompts = buildBuyerIntentPrompts(context)
    expect(Object.keys(prompts)).toHaveLength(3)
    expect(prompts.prompt1).toContain('SEO software')
    expect(prompts.prompt2).toContain('I need a SEO software solution')
    expect(prompts.prompt3).toContain('Semrush')
  })

  it('parses model response into mention and citation fields', () => {
    const parsed = parsePlatformResponse({
      platform: 'perplexity',
      prompt: 'What are the best SEO software tools?',
      rawResponse:
        '1. Semrush\n2. Flow Intent\nFlow Intent is great for marketing teams.\nhttps://semrush.com/blog/seo',
      citationUrls: ['https://www.g2.com/categories/seo-software'],
      domain: 'flowintent.com',
      context,
    })

    expect(parsed.brandMentioned).toBe(true)
    expect(parsed.brandPosition).toBe(2)
    expect(parsed.citationUrls.length).toBeGreaterThan(0)
  })

  it('computes hero metrics with fixed totalChecks = 5', () => {
    const platformResults = [
      {
        platform: 'perplexity' as const,
        prompt: 'p1',
        brandMentioned: true,
        brandPosition: 2,
        brandContext: 'Flow Intent appears second.',
        competitorsMentioned: ['Semrush'],
        citationUrls: ['https://semrush.com'],
        userDomainCited: false,
        competitorDomainsCited: ['semrush.com'],
        rawResponse: 'x',
      },
      {
        platform: 'perplexity' as const,
        prompt: 'p2',
        brandMentioned: false,
        brandPosition: null,
        brandContext: null,
        competitorsMentioned: ['Semrush', 'Ahrefs'],
        citationUrls: ['https://ahrefs.com'],
        userDomainCited: false,
        competitorDomainsCited: ['ahrefs.com'],
        rawResponse: 'x',
      },
      {
        platform: 'perplexity' as const,
        prompt: 'p3',
        brandMentioned: true,
        brandPosition: 1,
        brandContext: 'Flow Intent leads.',
        competitorsMentioned: ['Semrush'],
        citationUrls: [],
        userDomainCited: true,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
      {
        platform: 'grok' as const,
        prompt: 'p1',
        brandMentioned: false,
        brandPosition: null,
        brandContext: null,
        competitorsMentioned: ['Semrush'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
      {
        platform: 'gemini' as const,
        prompt: 'p1',
        brandMentioned: true,
        brandPosition: 3,
        brandContext: 'Flow Intent mentioned.',
        competitorsMentioned: ['Ahrefs'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
    ]

    const results = computeAuditResults(context, platformResults)
    expect(results.totalChecks).toBe(5)
    expect(results.brandFoundCount).toBe(3)
    expect(results.topCompetitor).toBe('Semrush')
  })

  it('uses positive benchmark copy when the brand matches the strongest competitor sample', () => {
    const platformResults = [
      {
        platform: 'perplexity' as const,
        prompt: 'p1',
        brandMentioned: true,
        brandPosition: 1,
        brandContext: 'Flow Intent leads.',
        competitorsMentioned: ['Semrush'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
      {
        platform: 'perplexity' as const,
        prompt: 'p2',
        brandMentioned: true,
        brandPosition: 2,
        brandContext: 'Flow Intent appears.',
        competitorsMentioned: ['Semrush'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
      {
        platform: 'perplexity' as const,
        prompt: 'p3',
        brandMentioned: false,
        brandPosition: null,
        brandContext: null,
        competitorsMentioned: ['Semrush'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
      {
        platform: 'grok' as const,
        prompt: 'p1',
        brandMentioned: true,
        brandPosition: 2,
        brandContext: 'Flow Intent appears.',
        competitorsMentioned: ['Ahrefs'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
      {
        platform: 'gemini' as const,
        prompt: 'p1',
        brandMentioned: false,
        brandPosition: null,
        brandContext: null,
        competitorsMentioned: ['Ahrefs'],
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        rawResponse: 'x',
      },
    ]

    const results = computeAuditResults(context, platformResults)

    expect(results.competitorAdvantage).toContain('at or above the strongest observed benchmark')
    expect(results.competitorAdvantage).not.toContain('visible room to grow')
  })

  it('handles fallback-style responses without citations', () => {
    const parsed = parsePlatformResponse({
      platform: 'perplexity',
      prompt: 'What are the best SEO software tools?',
      rawResponse: 'Temporary fallback response: Flow Intent and Semrush are often compared for marketing teams.',
      citationUrls: [],
      domain: 'flowintent.com',
      context,
    })

    expect(parsed.brandMentioned).toBe(true)
    expect(parsed.citationUrls).toEqual([])
    expect(parsed.competitorsMentioned).toContain('Semrush')
  })
})
