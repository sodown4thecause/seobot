import { generateObject } from 'ai'
import { z } from 'zod'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { serverEnv } from '@/lib/config/env'
import { countMentions, extractDomains } from './utils'
import type { GeoEngine, GeoVisibilityAnalysis } from './types'

const analysisSchema = z.object({
  brandMentioned: z.boolean(),
  mentionedBrands: z.array(z.string()),
  competitorMentions: z.record(z.number()),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'absent']),
  brandPosition: z.number().nullable(),
  visibilityScore: z.number().min(0).max(100),
  rationale: z.string(),
  recommendedContentActions: z.array(z.string()),
})

export async function analyzeGeoVisibility(input: {
  brand: string
  competitors: string[]
  prompt: string
  engine: GeoEngine
  responseText: string
  citedUrls: string[]
}): Promise<GeoVisibilityAnalysis> {
  if (!input.responseText.trim()) {
    return heuristicAnalysis(input)
  }

  try {
    const { object } = await generateObject({
      model: vercelGateway.languageModel(serverEnv.GEO_VISIBILITY_ANALYSIS_MODEL),
      schema: analysisSchema,
      prompt: `Analyze this GEO/AEO engine response for brand visibility.

Brand: ${input.brand}
Competitors: ${input.competitors.join(', ') || 'none provided'}
Engine: ${input.engine}
Prompt: ${input.prompt}
Cited URLs: ${input.citedUrls.join('\n') || 'none'}

Response:
${input.responseText}

Return a precise visibility analysis. Do not invent citations or mentions.`,
      providerOptions: {
        gateway: {
          tags: ['feature:geo-visibility-analysis'],
        },
      },
    })

    return {
      ...object,
      citedDomains: extractDomains(input.citedUrls),
      analysisMethod: 'llm',
    }
  } catch (error) {
    console.warn('[GEO] LLM visibility analysis failed, using heuristic fallback:', error)
    return heuristicAnalysis(input)
  }
}

function heuristicAnalysis(input: {
  brand: string
  competitors: string[]
  responseText: string
  citedUrls: string[]
}): GeoVisibilityAnalysis {
  const text = input.responseText || ''
  const brandMentions = countMentions(text, input.brand)
  const brandMentioned = brandMentions > 0
  const competitorMentions = Object.fromEntries(
    input.competitors.map(competitor => [competitor, countMentions(text, competitor)])
  )
  const citedDomains = extractDomains(input.citedUrls)
  const hasCitation = citedDomains.some(domain => domain.toLowerCase().includes(input.brand.toLowerCase()))
    || input.citedUrls.some(url => url.toLowerCase().includes(input.brand.toLowerCase()))

  const competitorPositions = input.competitors
    .map(competitor => text.toLowerCase().indexOf(competitor.toLowerCase()))
    .filter(position => position >= 0)
  const brandPositionIndex = text.toLowerCase().indexOf(input.brand.toLowerCase())
  const appearsBeforeCompetitors = brandPositionIndex >= 0
    && (competitorPositions.length === 0 || competitorPositions.every(position => brandPositionIndex < position))

  let visibilityScore = 0
  if (brandMentioned) visibilityScore = 40
  if (brandMentioned && hasCitation) visibilityScore = 70
  if (brandMentioned && appearsBeforeCompetitors) visibilityScore = Math.max(visibilityScore, 90)

  return {
    brandMentioned,
    mentionedBrands: [
      ...(brandMentioned ? [input.brand] : []),
      ...input.competitors.filter(competitor => competitorMentions[competitor] > 0),
    ],
    competitorMentions,
    citedDomains,
    sentiment: brandMentioned ? 'neutral' : 'absent',
    brandPosition: brandMentioned ? 1 : null,
    visibilityScore,
    rationale: brandMentioned
      ? 'Heuristic analysis found the brand in the response and scored visibility from mention order and citation presence.'
      : 'Heuristic analysis did not find the brand in the response.',
    recommendedContentActions: brandMentioned
      ? ['Strengthen source pages that answer this prompt directly and add quotable evidence blocks.']
      : ['Create or refresh authoritative content that directly answers this prompt and can be cited by answer engines.'],
    analysisMethod: 'heuristic',
  }
}
