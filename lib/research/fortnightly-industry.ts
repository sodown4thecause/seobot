import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { researchJobs, type Json } from '@/lib/db/schema'
import { serverEnv } from '@/lib/config/env'
import type { ChatMode } from '@/lib/chat/modes'
import { ingestRagDocument } from '@/lib/rag/ingest'
import { searchWithPerplexity, type PerplexityCitation } from '@/lib/external-apis/perplexity'
import { checkSpendGate } from '@/lib/usage/spend-gate'
import { generateResearchSummary } from './generate-summary'

type IndustryResearchMode = ChatMode

interface ResearchQuestion {
  topic: string
  query: string
}

interface SourcePacket {
  topic: string
  query: string
  answer: string
  citations: PerplexityCitation[]
  success: boolean
  error?: string
}

export interface SourcePage {
  url: string
  title: string
  content: string
  score: number
  fetchedAt: string
}

export interface FortnightlyIndustryResearchResult {
  mode: IndustryResearchMode
  status: 'complete' | 'failed'
  jobId?: string
  chunkCount: number
  summary?: string
  sourceCount?: number
  sourcePageCount?: number
  error?: string
}

const MODE_RESEARCH_QUESTIONS: Record<IndustryResearchMode, ResearchQuestion[]> = {
  seo: [
    {
      topic: 'Search ranking systems and SERP volatility',
      query:
        'Research the most important SEO ranking-system updates, SERP volatility patterns, and crawl/indexing changes from the last month. Prioritize primary Google documentation, named case studies, and original data.',
    },
    {
      topic: 'Technical SEO and content quality evidence',
      query:
        'Find recent technical SEO, content quality, internal linking, and structured data case studies or white papers from the last month. Extract what changed, the measured impact, and implementation caveats.',
    },
  ],
  geo: [
    {
      topic: 'AI Overviews and LLM citation behavior',
      query:
        'Research recent evidence on Google AI Overviews, ChatGPT search, Perplexity, Gemini, and Claude citation behavior. Prioritize studies with methodology, source overlap, citation rates, and brand mention findings.',
    },
    {
      topic: 'GEO and answer-engine optimization tactics',
      query:
        'Find recent GEO, AEO, and LLM visibility case studies or white papers. Extract which website changes improved citations or mentions, what did not work, and what evidence supports the claims.',
    },
  ],
  content: [
    {
      topic: 'Content strategy and editorial performance',
      query:
        'Research recent content marketing, E-E-A-T, editorial operations, and AI-assisted publishing studies from the last month. Focus on actionable findings, risks, and measured results.',
    },
    {
      topic: 'Formats and frameworks worth testing',
      query:
        'Find recent case studies about content formats, comparison pages, original research, expert quotes, statistics, templates, and tools that improved organic search or AI citation visibility.',
    },
  ],
  social: [
    {
      topic: 'Social search and community-led discovery',
      query:
        'Research recent evidence on Reddit, X/Twitter, LinkedIn, YouTube, and forum discussions influencing SEO, AI search visibility, product discovery, and brand trust. Prioritize source-backed findings.',
    },
    {
      topic: 'Audience language and objection mining',
      query:
        'Find recent case studies or guides on using social listening, Reddit research, X/Twitter conversations, and community discussions for SEO/GEO content strategy and positioning.',
    },
  ],
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()))
  return results
}

function dedupeCitations(packets: SourcePacket[]): PerplexityCitation[] {
  const byUrl = new Map<string, PerplexityCitation>()
  for (const packet of packets) {
    for (const citation of packet.citations) {
      if (!citation.url) continue
      if (!byUrl.has(citation.url)) byUrl.set(citation.url, citation)
    }
  }
  return [...byUrl.values()]
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'from', 'with', 'that', 'this', 'their', 'are', 'was',
  'but', 'not', 'you', 'your', 'what', 'how', 'why', 'when', 'who', 'has',
  'have', 'had', 'all', 'any', 'most', 'more', 'than', 'into', 'out', 'use',
  'using', 'recent', 'last', 'month', 'find', 'research', 'prioritize',
])

function extractKeywords(questions: ResearchQuestion[]): string[] {
  const tokens = new Set<string>()
  for (const question of questions) {
    const text = `${question.topic} ${question.query}`
    for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
      const token = raw.trim()
      if (token.length < 4) continue
      if (STOP_WORDS.has(token)) continue
      tokens.add(token)
    }
  }
  return [...tokens]
}

function scoreRelevance(page: { title: string; content: string }, keywords: string[]): number {
  if (keywords.length === 0) return 0
  const haystack = `${page.title} ${page.content}`.toLowerCase()
  let hits = 0
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) hits += 1
  }
  return Math.min(hits / keywords.length, 1)
}

async function fetchViaJinaReader(url: string): Promise<SourcePage | null> {
  if (!serverEnv.JINA_API_KEY) return null
  const readerUrl = `https://r.jina.ai/${url}`
  const response = await fetch(readerUrl, {
    headers: {
      Authorization: `Bearer ${serverEnv.JINA_API_KEY}`,
      Accept: 'text/markdown',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    throw new Error(`Jina reader ${response.status} for ${url}`)
  }
  const text = await response.text()
  if (!text.trim()) return null
  const titleMatch = text.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1]?.trim() || url
  return {
    url,
    title,
    content: text.slice(0, 2000),
    score: 0,
    fetchedAt: new Date().toISOString(),
  }
}

async function fetchCitedSourcePages(
  citations: PerplexityCitation[],
  questions: ResearchQuestion[]
): Promise<SourcePage[]> {
  if (!serverEnv.JINA_API_KEY) {
    return []
  }

  const keywords = extractKeywords(questions)
  const pages = await mapWithConcurrency(citations, 3, async (citation): Promise<SourcePage | null> => {
    if (!citation.url) return null
    try {
      const page = await fetchViaJinaReader(citation.url)
      if (!page) return null
      page.score = scoreRelevance(page, keywords)
      if (citation.title) page.title = citation.title
      return page
    } catch {
      return null
    }
  })

  return pages.filter((page): page is SourcePage => page !== null)
}

function toJsonPacket(packet: SourcePacket): Json {
  return {
    topic: packet.topic,
    query: packet.query,
    answer: packet.answer,
    success: packet.success,
    error: packet.error ?? null,
    citationUrls: packet.citations.map(citation => citation.url),
  }
}

function buildSynthesisPrompt(mode: IndustryResearchMode, packets: SourcePacket[]): string {
  const citationList = dedupeCitations(packets)
    .map((citation, index) => `${index + 1}. ${citation.title ? `${citation.title} - ` : ''}${citation.url}`)
    .join('\n')

  return `Create a fortnightly ${mode.toUpperCase()} industry research digest for FlowIntent's ${mode} mode RAG.

Use only the Perplexity research packets and citations below. Do not invent metrics, dates, or sources. Label uncertain claims.

Research packets:
${JSON.stringify(packets.map(packet => ({
  topic: packet.topic,
  query: packet.query,
  success: packet.success,
  error: packet.error,
  answer: packet.answer,
  citationUrls: packet.citations.map(citation => citation.url),
})), null, 2)}

Citations:
${citationList || '- No citations returned'}

Produce Markdown optimized for retrieval:
- Start with a concise executive summary.
- Use stable H2 headings by topic.
- Under each H2, write short self-contained claim blocks that include source URLs.
- Add "What changed", "Evidence", "Recommended agent guidance", and "Watch next" sections.
- Include source-tier notes where obvious: primary research/docs, case study, reputable industry analysis, or commentary.
- Keep this mode-specific. Do not include user-identifying details or private customer data.`
}

async function gatherSourcePackets(questions: ResearchQuestion[]): Promise<SourcePacket[]> {
  return mapWithConcurrency(questions, 2, async (question) => {
    const result = await searchWithPerplexity({
      query: question.query,
      searchRecencyFilter: 'month',
      returnCitations: true,
      model: 'sonar-pro',
    })

    return {
      topic: question.topic,
      query: question.query,
      answer: result.answer,
      citations: result.citations,
      success: result.success,
      error: result.error,
    }
  })
}

export async function runFortnightlyIndustryResearchForMode(
  mode: IndustryResearchMode
): Promise<FortnightlyIndustryResearchResult> {
  const [job] = await db
    .insert(researchJobs)
    .values({ mode, status: 'processing', startedAt: new Date() })
    .returning()

  try {
    const packets = await gatherSourcePackets(MODE_RESEARCH_QUESTIONS[mode])
    const successfulPackets = packets.filter(packet => packet.success)
    if (successfulPackets.length === 0) {
      throw new Error(`No successful Perplexity research packets for ${mode}`)
    }

    const synthesis = await generateResearchSummary(
      buildSynthesisPrompt(mode, packets),
      `fortnightly-${mode}-industry-research`
    )
    const citations = dedupeCitations(packets)
    const packetJson = packets.map(toJsonPacket)
    const citationUrls = citations.map(citation => citation.url)

    const sourcePages = await fetchCitedSourcePages(citations, MODE_RESEARCH_QUESTIONS[mode])
    let sourcePageChunkCount = 0
    for (const page of sourcePages) {
      if (page.score <= 0.3) continue
      const pageIngest = await ingestRagDocument({
        mode,
        sourceType: 'fortnightly_source_page',
        title: page.title,
        url: page.url,
        rawMarkdown: page.content,
        metadata: {
          researchJobId: job.id,
          cadence: 'fortnightly',
          sourceProvider: 'jina',
          sourcePageScore: page.score,
          fetchedAt: page.fetchedAt,
        },
        chunking: {
          strategy: 'markdown-section',
          maxChars: 2600,
          overlapChars: 300,
          minChars: 120,
        },
      })
      if (!pageIngest.skipped) sourcePageChunkCount += pageIngest.chunkCount
    }

    const ingest = await ingestRagDocument({
      mode,
      sourceType: 'fortnightly_industry_research',
      title: `${mode.toUpperCase()} fortnightly industry research ${new Date().toISOString().slice(0, 10)}`,
      rawMarkdown: synthesis.summary,
      rawJson: {
        packets: packetJson,
        citationUrls,
      },
      metadata: {
        researchJobId: job.id,
        generatedBy: synthesis.model,
        cadence: 'fortnightly',
        sourceProvider: 'perplexity',
        queryCount: packets.length,
        successfulQueryCount: successfulPackets.length,
        sourceCount: citations.length,
      },
      chunking: {
        strategy: 'markdown-section',
        maxChars: 3600,
        overlapChars: 450,
        minChars: 120,
      },
    })

    const rawJson = {
      packets: packetJson,
      citationUrls,
      sourceCount: citations.length,
      chunkCount: ingest.chunkCount,
      generatedBy: synthesis.model,
      sourcePageCount: sourcePages.length,
      sourcePageChunkCount,
    }

    await db
      .update(researchJobs)
      .set({
        status: 'complete',
        summary: synthesis.summary,
        rawJson,
        completedAt: new Date(),
      })
      .where(eq(researchJobs.id, job.id))

    return {
      mode,
      status: 'complete',
      jobId: job.id,
      chunkCount: ingest.chunkCount,
      summary: synthesis.summary,
      sourceCount: citations.length,
      sourcePageCount: sourcePages.length,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Fortnightly ${mode} industry research failed`
    await db
      .update(researchJobs)
      .set({ status: 'failed', summary: message, completedAt: new Date() })
      .where(eq(researchJobs.id, job.id))

    return { mode, status: 'failed', jobId: job.id, chunkCount: 0, error: message }
  }
}

export async function runFortnightlyIndustryResearch(
  modes: IndustryResearchMode[] = ['seo', 'geo', 'content', 'social'],
  userId?: string,
): Promise<FortnightlyIndustryResearchResult[]> {
  if (userId) {
    const estimatedCost = modes.length * 4 * 0.003
    const gate = await checkSpendGate(userId, estimatedCost)
    if (!gate.allowed) {
      console.warn('[Fortnightly Research] Spend gate blocked fan-out:', {
        userId,
        reason: gate.reason,
        currentSpend: gate.currentSpend,
        limit: gate.limit,
        estimatedCost,
      })
      return modes.map(mode => ({
        mode,
        status: 'failed' as const,
        chunkCount: 0,
        error: gate.reason ?? 'Monthly spend limit would be exceeded (cost gate)',
      }))
    }
  }
  return mapWithConcurrency(modes, 2, mode => runFortnightlyIndustryResearchForMode(mode))
}
