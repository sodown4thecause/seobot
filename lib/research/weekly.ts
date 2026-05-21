import { generateText } from 'ai'
import { and, eq, or, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessProfiles, geoPrompts, geoRuns, researchJobs, type Json } from '@/lib/db/schema'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { ingestRagDocument } from '@/lib/rag/ingest'
import { analyzeGeoVisibility } from '@/lib/geo/analysis'
import { getGeoEngineAdapter } from '@/lib/geo/adapters'
import { parseGeoEngines, splitEnvList } from '@/lib/geo/utils'
import { listGeoBusinessProfiles, type GeoBusinessProfile } from '@/lib/geo/profile'
import type { ChatMode } from '@/lib/chat/modes'
import type { GeoEngine, GeoEngineResult } from '@/lib/geo/types'
import { serverEnv } from '@/lib/config/env'
const RESEARCH_MODEL = serverEnv.GEO_RESEARCH_MODEL
const FALLBACK_RESEARCH_MODEL = serverEnv.GEO_RESEARCH_FALLBACK_MODEL
const GEO_WEEKLY_PROFILE_LIMIT = serverEnv.GEO_WEEKLY_PROFILE_LIMIT
const GEO_WEEKLY_PROMPT_LIMIT = serverEnv.GEO_WEEKLY_PROMPT_LIMIT
const GEO_WEEKLY_MAX_RUNS = serverEnv.GEO_WEEKLY_MAX_RUNS
const GEO_WEEKLY_RUN_CONCURRENCY = serverEnv.GEO_WEEKLY_RUN_CONCURRENCY

type ResearchMode = Extract<ChatMode, 'seo' | 'geo'>

type GeoWeeklyRunResult = {
  profile: GeoBusinessProfile
  row: typeof geoRuns.$inferInsert
  engineResult: GeoEngineResult
  analysis: Awaited<ReturnType<typeof analyzeGeoVisibility>>
}

type GeoWeeklyRunTask = {
  profile: GeoBusinessProfile
  geoPromptId: string | null
  prompt: string
  topic?: string | null
  brand: string
  competitors: string[]
  engine: GeoEngine
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length))
  const results = new Array<R>(items.length)
  let nextIndex = 0

  await Promise.all(Array.from({ length: safeConcurrency }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await worker(items[index], index)
    }
  }))

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
  const profiles = await listGeoBusinessProfiles(GEO_WEEKLY_PROFILE_LIMIT)
  if (profiles.length === 0) {
    throw new Error('No business profiles found for weekly GEO research')
  }

  const fallbackTopics = splitEnvList(serverEnv.GEO_DEFAULT_TOPICS)
  const runTasks: GeoWeeklyRunTask[] = []

  for (const profile of profiles) {
    const selectedPromptRows = (
      await db
        .select()
        .from(geoPrompts)
        .where(and(
          eq(geoPrompts.active, true),
          or(eq(geoPrompts.userId, profile.userId), isNull(geoPrompts.userId)),
        ))
        .limit(25)
    ).slice(0, GEO_WEEKLY_PROMPT_LIMIT)

    const prompts = selectedPromptRows.length > 0
      ? selectedPromptRows
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
        runTasks.push({
          profile,
          geoPromptId: promptRow.id ?? null,
          prompt: promptRow.prompt,
          topic: promptRow.topic || undefined,
          brand,
          competitors,
          engine,
        })
      }
    }
  }

  const totalPlannedRuns = runTasks.length
  const tasksToRun = runTasks.slice(0, GEO_WEEKLY_MAX_RUNS)
  const skippedRuns = Math.max(0, totalPlannedRuns - tasksToRun.length)

  const runResults = await mapWithConcurrency(tasksToRun, GEO_WEEKLY_RUN_CONCURRENCY, async (task): Promise<GeoWeeklyRunResult> => {
    const adapter = getGeoEngineAdapter(task.engine)
    const engineResult = await adapter.runPrompt({
      prompt: task.prompt,
      brand: task.brand,
      competitors: task.competitors,
      topic: task.topic || undefined,
    })
    const analysis = await analyzeGeoVisibility({
      brand: task.brand,
      competitors: task.competitors,
      prompt: task.prompt,
      engine: task.engine,
      responseText: engineResult.responseText,
      citedUrls: engineResult.citedUrls,
    })

    const [row] = await db.insert(geoRuns).values({
      userId: task.profile.userId,
      geoPromptId: task.geoPromptId,
      engine: task.engine,
      prompt: task.prompt,
      brand: task.brand,
      competitors: task.competitors,
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

    return {
      profile: task.profile,
      row,
      engineResult,
      analysis,
    }
  })

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
  mentionedBrandsCount: result.analysis.mentionedBrands.length,
  competitorMentionCount: Object.values(result.analysis.competitorMentions || {}).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0),
  analysisMethod: result.analysis.analysisMethod,
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
      plannedRunCount: totalPlannedRuns,
      skippedRunCount: skippedRuns,
      concurrency: GEO_WEEKLY_RUN_CONCURRENCY,
      runs: runResults.map(result => ({
        id: result.row.id,
        engine: result.row.engine,
        status: result.row.status,
        visibilityScore: result.analysis.visibilityScore,
      })),
    },
  }
}

async function generateResearchSummary(prompt: string, tag: string) {
  try {
    const result = await generateText({
      model: vercelGateway.languageModel(RESEARCH_MODEL),
      prompt,
      providerOptions: {
        gateway: {
          tags: [`feature:${tag}`, 'mode:weekly-research'],
        },
      },
    })

    return {
      summary: result.text,
      model: RESEARCH_MODEL,
      rawJson: { usage: result.usage },
    }
  } catch (error) {
    console.warn(`[Research] ${RESEARCH_MODEL} failed, falling back to ${FALLBACK_RESEARCH_MODEL}:`, error)
    const result = await generateText({
      model: vercelGateway.languageModel(FALLBACK_RESEARCH_MODEL),
      prompt,
      providerOptions: {
        gateway: {
          tags: [`feature:${tag}`, 'mode:fallback-research'],
        },
      },
    })

    return {
      summary: result.text,
      model: FALLBACK_RESEARCH_MODEL,
      rawJson: {
        usage: result.usage,
        fallbackReason: error instanceof Error ? error.message : String(error),
      },
    }
  }
}
