/**
 * SEO/AEO Syntax Architect Agent
 * Restructures content into highly optimized, machine-readable, AEO-friendly formats
 */

import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { z } from 'zod'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { createTelemetryConfig } from '@/lib/observability/langfuse'

const SYNTAX_REPORT_SCHEMA = z.object({
  h1Present: z.boolean().describe('Whether a single H1 tag is present'),
  h2QuestionHeading: z.boolean().describe('Whether at least one H2 is phrased as a question'),
  maxParagraphLength: z.number().describe('Maximum sentences in any paragraph'),
  listItemsCapitalized: z.boolean().describe('Whether list items start with capital letters'),
  primaryKeywordBolded: z.boolean().describe('Whether primary keyword is bolded in first 100 words'),
  headingHierarchyValid: z.boolean().describe('Whether heading hierarchy follows H1 > H2 > H3 pattern'),
  directAnswerProtocolFollowed: z.boolean().describe('Whether direct answers follow question headings'),
})

const SEO_AEO_SYNTAX_SCHEMA = z.object({
  metaTitle: z.string().describe('SEO meta title (50-60 chars, primary keyword front-loaded)'),
  metaDescription: z.string().describe('Meta description (150-160 chars with hook, solution, CTA)'),
  slug: z.string().describe('URL-friendly slug (lowercase, hyphens, no stop words)'),
  directAnswer: z.string().describe('40-50 word AEO summary for featured snippets'),
  formattedContent: z.string().describe('Full restructured content in markdown following SEO/AEO syntax'),
  syntaxReport: SYNTAX_REPORT_SCHEMA,
})

export type SyntaxReport = z.infer<typeof SYNTAX_REPORT_SCHEMA>
export type SEOAEOSyntaxOutput = z.infer<typeof SEO_AEO_SYNTAX_SCHEMA>

export interface SEOAEOSyntaxParams {
  content: string
  primaryKeyword: string
  secondaryKeywords?: string[]
  contentType: 'blog_post' | 'article' | 'social_media' | 'landing_page'
  brandName?: string
  userId?: string
  langfuseTraceId?: string // For grouping spans under a parent trace
  sessionId?: string // For Langfuse session tracking
  abortSignal?: AbortSignal // Optional: signal to abort syntax optimization
}

export interface SEOAEOSyntaxResult {
  metaTitle: string
  metaDescription: string
  slug: string
  directAnswer: string
  formattedContent: string
  syntaxReport: SyntaxReport
}

export class SEOAEOSyntaxAgent {
  /**
   * Optimize content structure for SEO and AEO
   */
  async optimize(params: SEOAEOSyntaxParams): Promise<SEOAEOSyntaxResult> {
    console.log('[SEO/AEO Syntax Agent] Optimizing content for:', params.primaryKeyword)

    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(params)

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { object: result, usage } = await generateObject({
        model: vercelGateway.languageModel('google/gemini-2.5-flash' as GatewayModelId),
        schema: SEO_AEO_SYNTAX_SCHEMA,

        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.4,
        ...(params.abortSignal ? { abortSignal: params.abortSignal } : {}),
        experimental_telemetry: createTelemetryConfig('seo-aeo-syntax', {
          userId: params.userId,
          sessionId: params.sessionId,
          langfuseTraceId: params.langfuseTraceId,
          primaryKeyword: params.primaryKeyword,
          contentType: params.contentType,
          contentLength: params.content?.length || 0,
          hasSecondaryKeywords: !!params.secondaryKeywords?.length,
          provider: 'google',
          model: 'gemini-2.5-flash',
        }),
      })

      // TODO: Re-implement usage logging with Drizzle ORM
      // Log usage
      // if (params.userId) {
      //   try {
      //     const { logAIUsage } = await import('@/lib/analytics/usage-logger')
      //     await logAIUsage({
      //       userId: params.userId,
      //       agentType: 'seo_aeo_syntax',
      //       model: 'google/gemini-2.5-flash',
      //       promptTokens: (usage as any)?.promptTokens || (usage as any)?.inputTokens || 0,
      //       completionTokens: (usage as any)?.completionTokens || (usage as any)?.outputTokens || 0,
      //       metadata: {
      //         primaryKeyword: params.primaryKeyword,
      //         contentType: params.contentType,
      //       },
      //     })
      //   } catch (error) {
      //     console.error('[SEO/AEO Syntax Agent] Error logging usage:', error)
      //   }
      // }

      console.log('[SEO/AEO Syntax Agent] ✓ Content optimized successfully')
      console.log(`[SEO/AEO Syntax Agent] Syntax report: H1=${result.syntaxReport.h1Present}, Question H2=${result.syntaxReport.h2QuestionHeading}, Valid Hierarchy=${result.syntaxReport.headingHierarchyValid}`)

      return {
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        slug: result.slug,
        directAnswer: result.directAnswer,
        formattedContent: result.formattedContent,
        syntaxReport: result.syntaxReport,
      }
    } catch (error) {
      console.error('[SEO/AEO Syntax Agent] Error optimizing content:', error)

      // Return original content with basic metadata on error
      return {
        metaTitle: this.generateFallbackTitle(params.primaryKeyword, params.brandName),
        metaDescription: this.generateFallbackDescription(params.primaryKeyword),
        slug: this.generateSlug(params.primaryKeyword),
        directAnswer: '',
        formattedContent: params.content,
        syntaxReport: {
          h1Present: false,
          h2QuestionHeading: false,
          maxParagraphLength: 0,
          listItemsCapitalized: false,
          primaryKeywordBolded: false,
          headingHierarchyValid: false,
          directAnswerProtocolFollowed: false,
        },
      }
    }
  }

  private buildSystemPrompt(): string {
    return `You are the SEO & AEO Syntax Architect. Your purpose is to take raw content and restructure it into highly optimized, machine-readable, and user-friendly web formats. You balance traditional SEO ranking factors with Answer Engine Optimization (AEO) to ensure content gets cited by AI search engines (ChatGPT, Perplexity, Gemini) and wins Featured Snippets on Google.

## Core Objectives
1. Maximize Readability: Content must be skimmable for humans
2. Maximize Crawlability: Structure must be logical for search bots
3. Answer Immediacy (AEO): Provide direct answers immediately after question headings

## Structural Guidelines

### Heading Hierarchy (H-Tags)
- H1 (Title): Must contain primary keyword. ONE H1 per page. Limit 60 characters.
- H2 (Main Sections): Break down H1. At least ONE H2 must be phrased as a question (e.g., "What is [Topic]?" or "How does [Topic] work?") for Voice Search and AEO.
- H3 (Sub-sections): Detailed steps or breakdowns within H2s.
- AEO Rule: Use literal headings, not clever ones. Use "Benefits of Keto" not "Why you should switch today".

### The "Direct Answer" Protocol (AEO)
- After any question-based H2, the FIRST sentence must be a direct, definitional answer (40-50 words).
- Structure: [Subject] is [Definition] because [Reason].
- NO fluff starts like "Many people wonder if...". Start directly with the answer.

## Content Syntax & Formatting

### Paragraphs & Text Density
- Maximum: 3 sentences per paragraph
- Visual breathing room between ideas
- Active voice. Sentences under 20 words where possible.

### Lists & Bullet Points
- Convert any series of 3+ items into bulleted or numbered list
- Ordered Lists (1, 2, 3): For steps, tutorials, rankings
- Unordered Lists (•): For features, benefits, ingredients
- ALWAYS capitalize first letter of list items

### Bolding & Emphasis
- Bold primary keyword ONCE in first 100 words
- Bold semantic entities and LSI keywords to help bots understand context
- Do NOT over-bold entire sentences. Only bold entities or key takeaway phrases.

## Meta Data Rules

### Meta Title
- Length: 50-60 characters
- Format: [Primary Keyword] - [Secondary Benefit/Hook] | [Brand Name]
- Front-load main keyword

### Meta Description
- Length: 150-160 characters
- Structure: Hook (pain point) + Solution (summary) + CTA ("Learn how," etc.)
- Include primary keyword naturally once

### URL Slug
- Lowercase only
- Separate words with hyphens (-)
- Remove stop words (and, or, the, a)

## Output Format
When restructuring content, produce markdown with:
1. H1 title with primary keyword
2. Meta title, meta description, slug at top
3. Direct answer summary for AEO
4. Question-based H2 headings with direct answers
5. Proper list formatting
6. Strategic keyword bolding
7. Clean paragraph structure (max 3 sentences each)`
  }

  private buildUserPrompt(params: SEOAEOSyntaxParams): string {
    const secondaryKeywordsText = params.secondaryKeywords?.length
      ? `\nSecondary Keywords: ${params.secondaryKeywords.join(', ')}`
      : ''

    const brandText = params.brandName ? `\nBrand Name: ${params.brandName}` : ''

    return `Restructure the following content according to SEO/AEO syntax guidelines.

Primary Keyword: ${params.primaryKeyword}${secondaryKeywordsText}
Content Type: ${params.contentType}${brandText}

CONTENT TO OPTIMIZE:
${params.content}

REQUIREMENTS:
1. Create an SEO-optimized meta title (50-60 chars, front-load keyword)
2. Write a compelling meta description (150-160 chars with hook, solution, CTA)
3. Generate a URL-friendly slug (lowercase, hyphens, no stop words)
4. Write a direct answer summary (40-50 words) for AEO/featured snippets
5. Restructure the full content following all syntax guidelines:
   - Single H1 with primary keyword
   - At least one question-based H2 with direct answer following it
   - Max 3 sentences per paragraph
   - Convert 3+ item series to lists (capitalize first letters)
   - Bold primary keyword in first 100 words
   - Bold LSI/semantic keywords throughout
   - Maintain heading hierarchy (H1 > H2 > H3)
6. Provide a syntax compliance report

Preserve all factual content and citations from the original. Only restructure formatting and add required elements.`
  }

  private generateSlug(keyword: string): string {
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    return keyword
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.includes(word))
      .join('-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)
  }

  private generateFallbackTitle(keyword: string, brandName?: string): string {
    const brand = brandName ? ` | ${brandName}` : ''
    const title = keyword.charAt(0).toUpperCase() + keyword.slice(1)
    return `${title} - Complete Guide${brand}`.substring(0, 60)
  }

  private generateFallbackDescription(keyword: string): string {
    return `Learn everything about ${keyword}. Discover key insights, best practices, and actionable tips. Read more.`.substring(0, 160)
  }
}
