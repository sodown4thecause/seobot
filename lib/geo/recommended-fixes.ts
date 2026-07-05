export type GeoFixType =
  | 'article_brief'
  | 'faq_block'
  | 'comparison_page'
  | 'schema_fix'
  | 'third_party_coverage'

export interface GeoRecommendedFix {
  id: string
  fixType: GeoFixType
  title: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  targetPlatforms: string[]
  suggestedPrompt: string
}

export interface GeoScanPlatformResult {
  platform: string
  brandMentioned: boolean
  mentionContext: string | null
  competitorsMentioned: string[]
  citations: Array<{ title: string; url: string }>
  sentiment: string
}

export interface GeoScanSummaryInput {
  brand: string
  query: string
  platforms: GeoScanPlatformResult[]
  summary: {
    mentionedOn: number
    totalPlatforms: number
    shareOfVoice: number
  }
}

function citationContentType(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('g2.com') || lower.includes('capterra')) return 'review directory'
  if (lower.includes('reddit.com')) return 'community discussion'
  if (lower.includes('youtube.com')) return 'video content'
  if (lower.includes('wikipedia.org')) return 'encyclopedia reference'
  if (lower.match(/compare|vs|alternative/)) return 'comparison page'
  if (lower.includes('/blog') || lower.includes('/articles')) return 'blog article'
  return 'web page'
}

export function deriveRecommendedFixes(input: GeoScanSummaryInput): GeoRecommendedFix[] {
  const fixes: GeoRecommendedFix[] = []
  const { brand, query, platforms, summary } = input

  const missing = platforms.filter((p) => !p.brandMentioned)
  const present = platforms.filter((p) => p.brandMentioned)

  if (summary.mentionedOn === 0) {
    const topCompetitors = [
      ...new Set(platforms.flatMap((p) => p.competitorsMentioned)),
    ].slice(0, 3)

    fixes.push({
      id: 'fix-zero-visibility-comparison',
      fixType: 'comparison_page',
      title: `Create a comparison page for "${query}"`,
      rationale: topCompetitors.length
        ? `${brand} was not cited on any platform. Competitors appearing instead: ${topCompetitors.join(', ')}.`
        : `${brand} was not cited on any platform for this query.`,
      priority: 'high',
      targetPlatforms: platforms.map((p) => p.platform),
      suggestedPrompt: `Create a detailed comparison page targeting "${query}" that positions ${brand} against ${topCompetitors.join(', ') || 'top competitors'}. Include feature tables, pricing context, and FAQ schema.`,
    })

    fixes.push({
      id: 'fix-zero-visibility-third-party',
      fixType: 'third_party_coverage',
      title: 'Build third-party validation signals',
      rationale:
        'AI engines heavily weight G2, Capterra, Reddit, and industry publications when recommending brands.',
      priority: 'high',
      targetPlatforms: ['ChatGPT', 'Perplexity'],
      suggestedPrompt: `Outline a third-party coverage plan for ${brand} to earn AI citations for "${query}" — G2 profile, comparison blog outreach, and Reddit/community mentions.`,
    })
  }

  for (const platform of missing) {
    const citedUrls = platform.citations.slice(0, 3)
    const citationTypes = citedUrls.map((c) => citationContentType(c.url))
    const competitors = platform.competitorsMentioned.slice(0, 2)

    const fixType: GeoFixType =
      citationTypes.includes('comparison page') || citationTypes.includes('review directory')
        ? 'comparison_page'
        : citationTypes.includes('community discussion')
          ? 'third_party_coverage'
          : 'article_brief'

    fixes.push({
      id: `fix-missing-${platform.platform.toLowerCase().replace(/\s+/g, '-')}`,
      fixType,
      title: `Close visibility gap on ${platform.platform}`,
      rationale: competitors.length
        ? `${brand} missing on ${platform.platform} while ${competitors.join(', ')} appeared. Cited sources: ${citationTypes.join(', ') || 'unknown'}.`
        : `${brand} missing on ${platform.platform}. Top cited content types: ${citationTypes.join(', ') || 'general web pages'}.`,
      priority: platform.platform === 'Perplexity' || platform.platform === 'ChatGPT' ? 'high' : 'medium',
      targetPlatforms: [platform.platform],
      suggestedPrompt: buildFixPrompt({ brand, query, platform: platform.platform, fixType, citedUrls, competitors }),
    })
  }

  const negativeSentiment = present.filter((p) => p.sentiment === 'negative')
  if (negativeSentiment.length > 0) {
    fixes.push({
      id: 'fix-negative-sentiment',
      fixType: 'faq_block',
      title: 'Address negative AI sentiment with FAQ content',
      rationale: `${brand} appears with negative sentiment on ${negativeSentiment.map((p) => p.platform).join(', ')}. Publish clarifying FAQ and schema markup.`,
      priority: 'high',
      targetPlatforms: negativeSentiment.map((p) => p.platform),
      suggestedPrompt: `Write an FAQ block addressing concerns about ${brand} for "${query}". Include FAQ schema and factual, citation-ready answers.`,
    })
  }

  if (summary.shareOfVoice < 60 && summary.mentionedOn > 0) {
    fixes.push({
      id: 'fix-schema-entity',
      fixType: 'schema_fix',
      title: 'Add Organization + FAQ schema for entity clarity',
      rationale: `Share of voice is ${summary.shareOfVoice}%. Structured data helps Gemini and Google AI Overviews understand ${brand} as a distinct entity.`,
      priority: 'medium',
      targetPlatforms: ['Gemini', 'Google AI Overview'],
      suggestedPrompt: `Generate Organization and FAQ JSON-LD schema for ${brand} targeting "${query}".`,
    })
  }

  return fixes.slice(0, 6)
}

function buildFixPrompt(params: {
  brand: string
  query: string
  platform: string
  fixType: GeoFixType
  citedUrls: Array<{ title: string; url: string }>
  competitors: string[]
}): string {
  const { brand, query, platform, fixType, citedUrls, competitors } = params
  const citationHint =
    citedUrls.length > 0
      ? ` Match the structure of cited sources like ${citedUrls.map((c) => c.title || c.url).join(', ')}.`
      : ''

  switch (fixType) {
    case 'comparison_page':
      return `Write a comparison page for "${query}" featuring ${brand}${competitors.length ? ` vs ${competitors.join(', ')}` : ''} optimized for ${platform} citations.${citationHint}`
    case 'third_party_coverage':
      return `Create an outreach and content plan for ${brand} to earn ${platform} citations for "${query}" via third-party mentions.${citationHint}`
    case 'faq_block':
      return `Write an FAQ section with schema markup for ${brand} answering "${query}" for ${platform}.${citationHint}`
    default:
      return `Write an authoritative article brief and draft for ${brand} targeting "${query}" to earn citations on ${platform}.${citationHint}`
  }
}
