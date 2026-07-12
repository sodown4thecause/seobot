import { describe, expect, it } from 'vitest'
import {
  deriveRecommendedFixes,
  type GeoScanPlatformResult,
} from '@/lib/geo/recommended-fixes'
import {
  evaluateCrawlerAccess,
  extractSitemapUrls,
  parseRobotsTxt,
} from '@/lib/geo/crawlability-audit'
import {
  buildSchemaJsonLd,
  generateSchemaMarkup,
  wrapJsonLdScript,
} from '@/lib/geo/schema-markup-tool'
import { buildGeoFixPlan } from '@/lib/geo/fix-generator'

describe('deriveRecommendedFixes', () => {
  const basePlatforms: GeoScanPlatformResult[] = [
    {
      platform: 'ChatGPT',
      brandMentioned: false,
      mentionContext: null,
      competitorsMentioned: ['Ahrefs'],
      citations: [{ title: 'G2 Compare', url: 'https://g2.com/compare/ahrefs' }],
      sentiment: 'not_mentioned',
    },
    {
      platform: 'Perplexity',
      brandMentioned: true,
      mentionContext: 'FlowIntent is a solid option',
      competitorsMentioned: [],
      citations: [],
      sentiment: 'positive',
    },
  ]

  it('returns comparison and third-party fixes for zero visibility', () => {
    const fixes = deriveRecommendedFixes({
      brand: 'FlowIntent',
      query: 'best SEO tools',
      platforms: basePlatforms.map((p) => ({ ...p, brandMentioned: false })),
      summary: { mentionedOn: 0, totalPlatforms: 5, shareOfVoice: 0 },
    })

    expect(fixes.some((f) => f.fixType === 'comparison_page')).toBe(true)
    expect(fixes.some((f) => f.fixType === 'third_party_coverage')).toBe(true)
  })

  it('returns platform-specific fixes when brand is missing on some engines', () => {
    const fixes = deriveRecommendedFixes({
      brand: 'FlowIntent',
      query: 'best SEO tools',
      platforms: basePlatforms,
      summary: { mentionedOn: 1, totalPlatforms: 5, shareOfVoice: 20 },
    })

    expect(fixes.some((f) => f.targetPlatforms.includes('ChatGPT'))).toBe(true)
  })
})

describe('crawlability audit parsing', () => {
  const sampleRobots = `User-agent: *
Disallow: /admin/

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Disallow: /

Sitemap: https://example.com/sitemap.xml`

  it('parses robots.txt rules', () => {
    const rules = parseRobotsTxt(sampleRobots)
    expect(rules.some((r) => r.userAgent === 'GPTBot')).toBe(true)
    expect(rules.some((r) => r.userAgent === 'PerplexityBot')).toBe(true)
  })

  it('extracts sitemap URLs', () => {
    expect(extractSitemapUrls(sampleRobots)).toEqual(['https://example.com/sitemap.xml'])
  })

  it('marks blocked crawlers correctly', () => {
    const rules = parseRobotsTxt(sampleRobots)
    const gpt = evaluateCrawlerAccess(rules, 'GPTBot')
    const perplexity = evaluateCrawlerAccess(rules, 'PerplexityBot')

    expect(gpt.status).toBe('allowed')
    expect(perplexity.status).toBe('blocked')
  })

  it('supports robots wildcards and trailing end anchors', () => {
    const rules = parseRobotsTxt(`User-agent: GPTBot
Disallow: /*.pdf$
Allow: /public/*.pdf$`)

    expect(evaluateCrawlerAccess(rules, 'GPTBot', ['/private/report.pdf']).status).toBe('partially_blocked')
    expect(evaluateCrawlerAccess(rules, 'GPTBot', ['/private/report.pdf?download=1']).status).toBe('allowed')
    expect(evaluateCrawlerAccess(rules, 'GPTBot', ['/public/report.pdf']).status).toBe('allowed')
  })

  it('prefers Allow when equally specific rules both match', () => {
    const rules = parseRobotsTxt(`User-agent: GPTBot
Disallow: /private
Allow: /private`)

    expect(evaluateCrawlerAccess(rules, 'GPTBot', ['/private']).status).toBe('allowed')
  })
})

describe('schema markup tool', () => {
  it('builds valid Organization JSON-LD', () => {
    const output = generateSchemaMarkup({
      schemaType: 'Organization',
      name: 'FlowIntent',
      url: 'https://flowintent.com',
      description: 'AI SEO platform',
    })

    expect(output.validation.isValid).toBe(true)
    expect(output.jsonLd['@type']).toBe('Organization')
    expect(output.scriptTag).toContain('application/ld+json')
  })

  it('builds FAQPage with mainEntity', () => {
    const jsonLd = buildSchemaJsonLd({
      schemaType: 'FAQPage',
      name: 'FAQ',
      url: 'https://example.com/faq',
      faqs: [{ question: 'What is AEO?', answer: 'Answer engine optimization.' }],
    })

    expect(jsonLd['@type']).toBe('FAQPage')
    expect(wrapJsonLdScript(jsonLd)).toContain('Question')
  })
})

describe('buildGeoFixPlan', () => {
  it('returns a structured brief for comparison pages', () => {
    const plan = buildGeoFixPlan({
      brand: 'FlowIntent',
      query: 'best SEO tools',
      fixType: 'comparison_page',
      targetPlatforms: ['Perplexity'],
    })

    expect(plan.contentBrief.outline.length).toBeGreaterThan(0)
    expect(plan.contentBrief.targetKeywords).toContain('FlowIntent')
    expect(plan.targetPlatforms).toContain('Perplexity')
  })
})
