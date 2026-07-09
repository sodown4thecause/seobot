import { generateText } from 'ai'
import { and, eq, or, isNull, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessProfiles, geoPrompts, geoRuns, researchJobs, type Json } from '@/lib/db/schema'
import { ingestRagDocument } from '@/lib/rag/ingest'
import { analyzeGeoVisibility } from '@/lib/geo/analysis'
import { getGeoEngineAdapter } from '@/lib/geo/adapters'
import { parseGeoEngines, splitEnvList } from '@/lib/geo/utils'
import { listGeoBusinessProfiles, type GeoBusinessProfile } from '@/lib/geo/profile'
import type { ChatMode } from '@/lib/chat/modes'
import type { GeoEngineResult } from '@/lib/geo/types'
import { generateResearchSummary } from './generate-summary'
import { serverEnv } from '@/lib/config/env'

type ResearchMode = Extract<ChatMode, 'seo' | 'geo'>
type GeoPromptInput = typeof geoPrompts.$inferSelect | {
  id: null
  userId: string
  prompt: string
  brand: string
  topic: string
  competitors: string[]
  engines: string[]
}
type GeoRawWithSourceOpportunities = {
  exaSourceOpportunities?: {
    sources?: unknown[]
  }
}

function getSourceOpportunityCount(result: GeoEngineResult): number {
  const rawJson = result.rawJson as GeoRawWithSourceOpportunities | undefined
  return Array.isArray(rawJson?.exaSourceOpportunities?.sources)
    ? rawJson.exaSourceOpportunities.sources.length
    : 0
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++
      results[currentIndex] = await worker(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()))
  return results
}

export async function runWeeklyResearch(mode: ResearchMode) {
  const [job] = await db.insert(researchJobs).values({
    mode,
    status: 'processing',
    startedAt: new Date(),
  }).returning()

  try {
    const result = mode === 'seo'
      ? await runWeeklySeoResearch()
      : await runWeeklyGeoResearch()

    await db.update(researchJobs).set({
      status: 'complete',
      summary: result.summary,
      rawJson: result.rawJson as Json,
      completedAt: new Date(),
    }).where(eq(researchJobs.id, job.id))

    const ingest = await ingestRagDocument({
      mode,
      sourceType: 'weekly_research',
      title: `${mode.toUpperCase()} weekly research ${new Date().toISOString().slice(0, 10)}`,
      rawMarkdown: result.summary,
      metadata: {
        researchJobId: job.id,
        generatedBy: result.model,
      },
    })

    return {
      jobId: job.id,
      mode,
      summary: result.summary,
      chunkCount: ingest.chunkCount,
      rawJson: result.rawJson,
    }
  } catch (error) {
    await db.update(researchJobs).set({
      status: 'failed',
      summary: error instanceof Error ? error.message : 'Weekly research failed',
      completedAt: new Date(),
    }).where(eq(researchJobs.id, job.id))
    throw error
  }
}

async function runWeeklySeoResearch() {
  const profileRows = await db.select().from(businessProfiles).limit(20)
  const topics = splitEnvList(serverEnv.GEO_DEFAULT_TOPICS).length > 0
    ? splitEnvList(serverEnv.GEO_DEFAULT_TOPICS)
    : ['SEO industry changes', 'technical SEO', 'SERP volatility', 'content strategy', 'case studies', 'whitepapers']

  const context = profileRows.map(profile => ({
    industry: profile.industry,
    goals: profile.goals,
  }))

  const prompt = `Create a weekly SEO deep research summary for SEOBOT's SEO-mode RAG.

Focus areas:
${topics.map(topic => `- ${topic}`).join('\n')}

Known business profile context (anonymized industries and goals):
${JSON.stringify(context, null, 2)}

Produce structured Markdown with:
- Executive summary
- Ranking / SERP changes
- Keyword opportunities
- Competitor content observations
- Industry insights, case studies, and whitepaper ideas
- Recommended content updates
- Internal linking opportunities
- Next actions

Keep this strictly SEO-focused. Do not blend in GEO/AEO unless it materially affects SEO strategy and label it separately.`

  return generateResearchSummary(prompt, 'weekly-seo-research')
}

async function runWeeklyGeoResearch() {
  const profiles = await listGeoBusinessProfiles(50)
  if (profiles.length === 0) {
    throw new Error('No business profiles found for weekly GEO research')
  }

  const fallbackTopics = splitEnvList(serverEnv.GEO_DEFAULT_TOPICS)
  const runResults: Array<{ profile: GeoBusinessProfile; row: typeof geoRuns.$inferInsert; engineResult: GeoEngineResult; analysis: Awaited<ReturnType<typeof analyzeGeoVisibility>> }> = []
  const failedRuns: Array<{ userId: string; engine: string; prompt: string; error: string }> = []
  const profileIds = profiles.map(profile => profile.userId)
  const allPromptRows = await db
    .select()
    .from(geoPrompts)
    .where(and(
      eq(geoPrompts.active, true),
      or(inArray(geoPrompts.userId, profileIds), isNull(geoPrompts.userId)),
    ))

  const promptsByUser = new Map<string, GeoPromptInput[]>()
  for (const profile of profiles) {
    promptsByUser.set(
      profile.userId,
      allPromptRows.filter(row => row.userId === profile.userId || row.userId === null).slice(0, 25),
    )
  }

  const tasks: Array<{
    profile: GeoBusinessProfile
    promptRow: GeoPromptInput
    engine: ReturnType<typeof parseGeoEngines>[number]
    brand: string
    competitors: string[]
  }> = []

  for (const profile of profiles) {
    const promptRows = promptsByUser.get(profile.userId) ?? []
    const prompts = promptRows.length > 0
      ? promptRows
      : (fallbackTopics.length > 0 ? fallbackTopics : ['AI visibility', 'answer engine optimization', 'Google AI Overview citations']).map(topic => ({
          id: null,
          userId: profile.userId,
          prompt: `What are the best companies, services, or resources for ${topic} in ${profile.industry || 'this industry'}?`,
          brand: profile.brand,
          topic,
          competitors: profile.competitors,
          engines: parseGeoEngines(serverEnv.GEO_ENABLED_ENGINES),
        }))

    for (const promptRow of prompts) {
      const brand = promptRow.brand || profile.brand
      const competitors = promptRow.competitors?.length ? promptRow.competitors : profile.competitors
      const engines = parseGeoEngines(promptRow.engines as string[] | null)

      for (const engine of engines) {
        tasks.push({ profile, promptRow, engine, brand, competitors })
      }
    }
  }

  const completedRuns = await mapWithConcurrency(tasks, 3, async ({ profile, promptRow, engine, brand, competitors }) => {
    try {
      const adapter = getGeoEngineAdapter(engine)
      const engineResult = await adapter.runPrompt({
        prompt: promptRow.prompt,
        brand,
        competitors,
        topic: promptRow.topic || undefined,
      }, profile.userId)
      const analysis = await analyzeGeoVisibility({
        brand,
        competitors,
        prompt: promptRow.prompt,
        engine,
        responseText: engineResult.responseText,
        citedUrls: engineResult.citedUrls,
      })

      const [row] = await db.insert(geoRuns).values({
        userId: profile.userId,
        geoPromptId: promptRow.id,
        engine,
        prompt: promptRow.prompt,
        brand,
        competitors,
        responseText: engineResult.responseText,
        citedUrls: engineResult.citedUrls,
        citedDomains: engineResult.citedDomains,
        mentionedBrands: analysis.mentionedBrands,
        competitorMentions: analysis.competitorMentions as Json,
        sentiment: analysis.sentiment,
        brandPosition: analysis.brandPosition,
        visibilityScore: analysis.visibilityScore,
        status: engineResult.status,
        rawJson: ({
          engineResult,
          analysis,
        } as unknown) as Json,
        capturedAt: new Date(engineResult.capturedAt),
      }).returning()

      return { profile, row, engineResult, analysis }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GEO run failed'
      failedRuns.push({ userId: profile.userId, engine, prompt: promptRow.prompt, error: message })
      return null
    }
  })

  runResults.push(...completedRuns.filter((run): run is NonNullable<typeof run> => Boolean(run)))

  const prompt = `Create a weekly GEO/AEO deep research summary for SEOBOT's GEO-mode RAG.

This is an aggregated summary across active business profiles. Do NOT include any user-identifying information (user IDs, specific brand names, website URLs, or competitor names). Instead, synthesize general patterns, industry trends, and actionable recommendations applicable across profiles.

GEO run evidence (anonymized):
${JSON.stringify(runResults.map((result, index) => ({
  profileIndex: index + 1,
  engine: result.row.engine,
  status: result.row.status,
  visibilityScore: result.analysis.visibilityScore,
  sentiment: result.analysis.sentiment,
  citedDomainsCount: result.engineResult.citedDomains.length,
  sourceOpportunityCount: getSourceOpportunityCount(result.engineResult),
  mentionedBrandsCount: result.analysis.mentionedBrands.length,
  recommendedContentActions: result.analysis.recommendedContentActions,
})), null, 2)}

Produce structured Markdown with:
- Executive summary
- Visibility by engine
- Prompts where brand appeared
- Prompts where brand was absent
- Competitor mentions
- Cited domains and URLs
- Source/citation opportunities
- Industry insights, case studies, and whitepaper ideas for answer-engine visibility
- Content gaps
- Recommended website/content changes
- Next actions

Keep this strictly GEO/AEO-focused. Do not blend in classic SEO unless it directly supports answer-engine visibility.`

  const summary = await generateResearchSummary(prompt, 'weekly-geo-research')
  return {
    ...summary,
    rawJson: {
      ...summary.rawJson,
      runCount: runResults.length,
      failedRunCount: failedRuns.length,
      runs: runResults.map(result => ({
        id: result.row.id,
        engine: result.row.engine,
        status: result.row.status,
        visibilityScore: result.analysis.visibilityScore,
      })),
    },
  }
}
