/**
 * GEO fix generator — turns visibility gaps into actionable content fixes.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { RAGWriterOrchestrator } from '@/lib/agents/rag-writer-orchestrator'
import {
  deriveRecommendedFixes,
  type GeoFixType,
  type GeoRecommendedFix,
} from '@/lib/geo/recommended-fixes'

export interface GeoFixPlan {
  fixType: GeoFixType
  title: string
  brand: string
  query: string
  targetPlatforms: string[]
  contentBrief: {
    objective: string
    suggestedTitle: string
    targetKeywords: string[]
    outline: string[]
    aeoStructure: string[]
    estimatedImpact: string
  }
  nextStep: string
}

function buildContentBrief(params: {
  brand: string
  query: string
  fixType: GeoFixType
  targetPlatforms: string[]
  rationale?: string
}): GeoFixPlan['contentBrief'] {
  const { brand, query, fixType, targetPlatforms, rationale } = params

  const baseKeywords = [query, brand, `${brand} ${query}`, `best ${query}`]

  switch (fixType) {
    case 'comparison_page':
      return {
        objective: `Create a comparison page that earns citations on ${targetPlatforms.join(', ')} for "${query}".`,
        suggestedTitle: `${brand} vs Alternatives: ${query.charAt(0).toUpperCase()}${query.slice(1)} Compared`,
        targetKeywords: [...baseKeywords, `${brand} vs`, `${brand} alternatives`],
        outline: [
          'Executive summary with direct answer paragraph (40–60 words)',
          'Comparison criteria table (features, pricing, use cases)',
          'Detailed brand-by-brand analysis with ${brand} positioned accurately',
          'FAQ section addressing buyer objections',
          'Verifiable facts with sources and last-updated date',
        ],
        aeoStructure: [
          'Lead with a quotable definition sentence naming ${brand}',
          'Use H2 questions matching how buyers ask AI assistants',
          'Include FAQ schema for each objection',
          'Add Organization schema linking ${brand} entity',
        ],
        estimatedImpact: 'High — comparison pages are the #1 cited content type on Perplexity.',
      }

    case 'faq_block':
      return {
        objective: `Publish FAQ content with schema to correct AI sentiment and improve ${targetPlatforms.join(', ')} visibility.`,
        suggestedTitle: `${brand} FAQ: Everything You Need to Know About ${query}`,
        targetKeywords: [...baseKeywords, `${brand} FAQ`, `is ${brand} good`],
        outline: [
          'Direct answer summary paragraph',
          '8–12 buyer-intent questions with concise answers',
          'Pricing, features, and use-case clarifications',
          'Comparison to alternatives (neutral tone)',
        ],
        aeoStructure: [
          'Each answer 2–4 sentences, self-contained and citable',
          'FAQPage JSON-LD matching visible content exactly',
          'Include specific numbers and dates where possible',
        ],
        estimatedImpact: 'Medium-high — FAQ schema directly feeds Google AI Overviews and Gemini.',
      }

    case 'schema_fix':
      return {
        objective: `Strengthen entity signals so AI engines recognize ${brand} for "${query}".`,
        suggestedTitle: `${brand} — Entity & Schema Implementation Guide`,
        targetKeywords: baseKeywords,
        outline: [
          'Organization schema with sameAs profiles',
          'Product/Service schema if applicable',
          'FAQ schema for top buyer questions',
          'About page entity definition block',
        ],
        aeoStructure: [
          'Consistent brand name across all schema types',
          'sameAs links to G2, LinkedIn, Crunchbase',
          'Visible content must mirror structured data',
        ],
        estimatedImpact: 'Medium — entity clarity improves Gemini and Google AI Overview inclusion.',
      }

    case 'third_party_coverage':
      return {
        objective: `Build third-party mentions that ChatGPT and Perplexity trust for "${query}".`,
        suggestedTitle: `${brand} Third-Party Coverage Plan for AI Visibility`,
        targetKeywords: [...baseKeywords, `${brand} reviews`, `${brand} G2`],
        outline: [
          'Priority directory targets (G2, Capterra, TrustRadius)',
          'Comparison blog outreach list',
          'Reddit/community participation strategy',
          'Original data study or report concept',
        ],
        aeoStructure: [
          'Focus on earned mentions, not self-promotional content',
          'Ensure NAP and brand description consistency across platforms',
          'Track which third-party URLs get cited in AI answers',
        ],
        estimatedImpact: 'High — ChatGPT heavily weights third-party validation over owned content.',
      }

    default:
      return {
        objective: rationale ?? `Improve ${brand} visibility for "${query}" on ${targetPlatforms.join(', ')}.`,
        suggestedTitle: `${query.charAt(0).toUpperCase()}${query.slice(1)}: The Complete Guide (featuring ${brand})`,
        targetKeywords: baseKeywords,
        outline: [
          'Answer-first introduction (direct response to the query)',
          'Problem context and buyer criteria',
          'Solution landscape with ${brand} positioned naturally',
          'Implementation steps and best practices',
          'FAQ and next steps',
        ],
        aeoStructure: [
          'Block-structured sections with clear H2 questions',
          'Cite authoritative sources inline',
          'Include updated date and author credentials',
        ],
        estimatedImpact: 'Medium — authoritative guides earn citations when competitors lack depth.',
      }
  }
}

export function buildGeoFixPlan(params: {
  brand: string
  query: string
  fixType: GeoFixType
  targetPlatforms?: string[]
  rationale?: string
}): GeoFixPlan {
  const targetPlatforms = params.targetPlatforms?.length
    ? params.targetPlatforms
    : ['ChatGPT', 'Perplexity', 'Google AI Overview']

  const brief = buildContentBrief({
    brand: params.brand,
    query: params.query,
    fixType: params.fixType,
    targetPlatforms,
    rationale: params.rationale,
  })

  const titleByType: Record<GeoFixType, string> = {
    article_brief: 'Article Brief',
    faq_block: 'FAQ Content Fix',
    comparison_page: 'Comparison Page Fix',
    schema_fix: 'Schema & Entity Fix',
    third_party_coverage: 'Third-Party Coverage Plan',
  }

  return {
    fixType: params.fixType,
    title: titleByType[params.fixType],
    brand: params.brand,
    query: params.query,
    targetPlatforms,
    contentBrief: brief,
    nextStep: params.fixType === 'schema_fix'
      ? 'Call generate_schema_markup to produce JSON-LD, then implement on your site.'
      : 'Switch to Content mode or call generate_researched_content to produce the draft from this brief.',
  }
}

export function createGeoGenerateFixTool(userId?: string) {
  return tool({
    description:
      'Generate an actionable fix plan from a GEO visibility gap. Produces a structured content brief ' +
      '(outline, keywords, AEO structure) from brand scan insights. Set generateContent=true to also ' +
      'write the draft in the same turn. Use when the user clicks "Generate fix" or asks to fix a citation gap.',
    inputSchema: z.object({
      brand: z.string().describe('Brand name'),
      query: z.string().describe('The query/prompt where visibility is missing or weak'),
      fixType: z
        .enum(['article_brief', 'faq_block', 'comparison_page', 'schema_fix', 'third_party_coverage'])
        .describe('Type of fix to generate'),
      targetPlatforms: z
        .array(z.string())
        .optional()
        .describe('Platforms where the gap exists (e.g. ChatGPT, Perplexity)'),
      rationale: z.string().optional().describe('Why this fix is needed — from scan results'),
      scanSummary: z
        .object({
          shareOfVoice: z.number().optional(),
          mentionedOn: z.number().optional(),
          missingPlatforms: z.array(z.string()).optional(),
          competitorBrands: z.array(z.string()).optional(),
        })
        .optional()
        .describe('Optional context from geo_brand_scan'),
      generateContent: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, also generate the content draft using the brief'),
    }),
    execute: async (input) => {
      const plan = buildGeoFixPlan({
        brand: input.brand,
        query: input.query,
        fixType: input.fixType,
        targetPlatforms: input.targetPlatforms,
        rationale: input.rationale,
      })

      let recommendedFixes: GeoRecommendedFix[] = []
      if (input.scanSummary?.missingPlatforms?.length) {
        recommendedFixes = deriveRecommendedFixes({
          brand: input.brand,
          query: input.query,
          platforms: input.scanSummary.missingPlatforms.map((platform) => ({
            platform,
            brandMentioned: false,
            mentionContext: null,
            competitorsMentioned: input.scanSummary?.competitorBrands ?? [],
            citations: [],
            sentiment: 'not_mentioned',
          })),
          summary: {
            mentionedOn: input.scanSummary.mentionedOn ?? 0,
            totalPlatforms: 5,
            shareOfVoice: input.scanSummary.shareOfVoice ?? 0,
          },
        })
      }

      const result: Record<string, unknown> = {
        success: true,
        plan,
        recommendedFixes,
        handoff: {
          contentModePrompt: plan.contentBrief.objective,
          suggestedTool: input.fixType === 'schema_fix' ? 'generate_schema_markup' : 'generate_researched_content',
        },
      }

      if (input.generateContent && userId && input.fixType !== 'schema_fix' && input.fixType !== 'third_party_coverage') {
        try {
          const orchestrator = new RAGWriterOrchestrator()
          const contentType =
            input.fixType === 'comparison_page'
              ? 'landing_page'
              : input.fixType === 'faq_block'
                ? 'article'
                : 'blog_post'

          const content = await orchestrator.generateContent({
            topic: plan.contentBrief.suggestedTitle,
            type: contentType,
            keywords: plan.contentBrief.targetKeywords,
            userId,
            qualityMode: 'fast',
            skipFrase: true,
            skipEeat: true,
            skipRevisionLoop: true,
          })

          result.generatedContent = {
            title: content.metadata?.metaTitle ?? plan.contentBrief.suggestedTitle,
            content: content.content,
            wordCount: content.content.split(/\s+/).filter(Boolean).length,
          }
          result.nextStep = 'Review the generated draft, publish to your site, and re-run geo_brand_scan in 4 weeks.'
        } catch (error) {
          result.contentError =
            error instanceof Error ? error.message : 'Content generation failed'
          result.nextStep = plan.nextStep
        }
      } else {
        result.nextStep = plan.nextStep
      }

      return result
    },
  })
}
