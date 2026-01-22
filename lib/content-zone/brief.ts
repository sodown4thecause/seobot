import 'server-only'

import { z } from 'zod'
import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { EnhancedResearchAgent } from '@/lib/agents/enhanced-research-agent'
import { getDeepwikiTools } from '@/lib/mcp/deepwiki-client'

export const contentZoneBriefRequestSchema = z.object({
  topic: z.string().min(1),
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string().min(1)).default([]),
  contentType: z.enum(['blog_post', 'article', 'landing_page']).default('blog_post'),
  tone: z.string().optional(),
  audience: z.string().optional(),
  wordCount: z.number().int().min(300).max(6000).optional(),
  competitorUrls: z.array(z.string().url()).optional(),
  location: z.string().optional(),
  languageCode: z.string().optional(),
  deepwikiRepo: z.string().optional(),
  deepwikiQuestion: z.string().optional(),
})

export type ContentZoneBriefRequest = z.infer<typeof contentZoneBriefRequestSchema>

export const contentZoneBriefSchema = z.object({
  suggestedTitle: z.string(),
  suggestedSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  searchIntent: z
    .union([
      z.object({
        intent: z.enum(['informational', 'navigational', 'commercial', 'transactional']),
        probability: z.number().min(0).max(1).optional(),
      }),
      z.null(),
    ])
    .optional(),
  directAnswer: z.string(),
  outline: z.array(z.string()).min(3),
  faqs: z.array(z.string()).min(3),
  schemaSuggestions: z.array(z.string()).min(1),
  internalLinkingIdeas: z.array(z.string()).default([]),
  contentGapsToCover: z.array(z.string()).default([]),
  sourceCitations: z.array(
    z.object({
      url: z.string().url(),
      title: z.string().optional(),
    }),
  ),
  briefMarkdown: z.string(),
})

export type ContentZoneBrief = z.infer<typeof contentZoneBriefSchema>

function safeJsonParse(input: string): unknown {
  const cleaned = input.replace(/```json\\s*|```\\s*/g, '').trim()
  return JSON.parse(cleaned)
}

export async function createContentZoneBrief(
  request: ContentZoneBriefRequest & { userId?: string },
): Promise<{
  brief: ContentZoneBrief
  research: {
    citations: Array<{ url: string; title?: string; domain?: string }>
    serpData?: unknown
    competitorContent?: unknown
    deepwikiNotes?: string
  }
}> {
  const researchAgent = new EnhancedResearchAgent()
  const researchResult = await researchAgent.research({
    topic: request.topic,
    targetKeyword: request.primaryKeyword,
    competitorUrls: request.competitorUrls,
    depth: 'standard',
    languageCode: request.languageCode,
    location: request.location,
    userId: request.userId,
  })

  const citations = researchResult.citations ?? []

  let deepwikiNotes: string | undefined
  if (request.deepwikiRepo && request.deepwikiQuestion) {
    try {
      const deepwikiTools = await getDeepwikiTools()
      const askQuestionTool = deepwikiTools.ask_question
      if (!askQuestionTool?.execute) {
        throw new Error('DeepWiki tool ask_question is unavailable')
      }

      const raw = await askQuestionTool.execute(
        {
          repoName: request.deepwikiRepo,
          question: request.deepwikiQuestion,
        },
        { toolCallId: 'content-zone-deepwiki', messages: [] },
      )

      if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
        const content = (raw as { content: unknown[] }).content
        const text = content
          .filter(
            (c: unknown): c is { type: 'text'; text: string } =>
              !!c &&
              typeof c === 'object' &&
              'type' in c &&
              'text' in c &&
              (c as { type?: unknown }).type === 'text' &&
              typeof (c as { text?: unknown }).text === 'string',
          )
          .map((c) => c.text)
          .join('\n')
          .trim()
        if (text) deepwikiNotes = text
      }
    } catch {
      // Deepwiki is optional; ignore failures.
    }
  }

  const allowedCitationUrls = citations.map((c) => c.url).slice(0, 12)

  const prompt = `Create an SEO + AEO content brief as JSON.

Topic: ${request.topic}
Primary keyword: ${request.primaryKeyword}
Secondary keywords: ${request.secondaryKeywords.join(', ') || '(none)'}
Content type: ${request.contentType}
Tone: ${request.tone || '(not specified)'}
Audience: ${request.audience || '(not specified)'}
Target length (words): ${request.wordCount ?? '(not specified)'}

Search intent (if available): ${researchResult.searchIntent ? JSON.stringify(researchResult.searchIntent) : '(unknown)'}

SERP observations (if available):
${researchResult.serpData ? JSON.stringify(researchResult.serpData) : '(none)'}

Competitor headings/content extracts (if available):
${researchResult.competitorContent ? JSON.stringify(researchResult.competitorContent) : '(none)'}

Optional product/docs notes (from DeepWiki, if present):
${deepwikiNotes ? deepwikiNotes : '(none)'}

Allowed citations (ONLY use URLs from this list in sourceCitations):
${allowedCitationUrls.length ? allowedCitationUrls.map((u) => `- ${u}`).join('\n') : '(none)'}

Return ONLY valid JSON matching this schema:
{
  "suggestedTitle": string,
  "suggestedSlug": string,
  "searchIntent": { "intent": "informational"|"navigational"|"commercial"|"transactional", "probability"?: number } | null,
  "directAnswer": string, // 40-70 words, suitable for answer engines
  "outline": string[], // H2/H3 headings as strings, min 3
  "faqs": string[], // min 3, align to PAA and intent
  "schemaSuggestions": string[], // e.g. ["FAQPage","HowTo"]
  "internalLinkingIdeas": string[],
  "contentGapsToCover": string[],
  "sourceCitations": [{ "url": string, "title"?: string }],
  "briefMarkdown": string // concise, actionable brief in markdown
}

Hard rules:
- Do not invent citations; use ONLY allowed citation URLs.
- Keep suggestedSlug lowercase, hyphenated, no leading/trailing hyphens.
- Ensure briefMarkdown includes: angle, unique value, outline, FAQs, and a one-line meta title suggestion.`

  const { text } = await generateText({
    model: vercelGateway.languageModel('google/gemini-2.0-pro-exp-02-05'),
    system: 'You are a senior SEO + AEO strategist. Output ONLY valid JSON.',
    prompt,
  })

  const parsed = safeJsonParse(text)
  const brief = contentZoneBriefSchema.parse(parsed)

  const allowed = new Set(allowedCitationUrls)
  const filteredCitations = brief.sourceCitations.filter((c) => allowed.has(c.url))
  const normalizedBrief: ContentZoneBrief = {
    ...brief,
    sourceCitations: filteredCitations,
  }

  return {
    brief: normalizedBrief,
    research: {
      citations,
      serpData: researchResult.serpData,
      competitorContent: researchResult.competitorContent,
      deepwikiNotes,
    },
  }
}
