/**
 * Weekly Fresh Content Ingestion
 *
 * Orchestrates the weekly RAG ingestion pipeline across all three modes so
 * agents stay grounded in the latest industry knowledge:
 *
 * - `seo`     — SEO case studies, algorithm updates, ranking studies
 * - `geo`     — AI engine coverage reports, GEO strategy, citation analysis
 * - `content` — content marketing research, copywriting frameworks, EEAT
 *
 * `seo` and `geo` reuse the existing `runWeeklyResearch` pipeline. `content`
 * is added here: it generates a content-marketing research summary and ingests
 * it into the Content-mode RAG namespace.
 */

import { generateText } from 'ai'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessProfiles, researchJobs, type Json } from '@/lib/db/schema'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { serverEnv } from '@/lib/config/env'
import { runWeeklyResearch } from '@/lib/research/weekly'
import { ingestRagDocument } from './ingest'
import type { ChatMode } from '@/lib/chat/modes'
import { CHAT_MODES } from '@/lib/chat/modes'

const RESEARCH_MODEL = serverEnv.WEEKLY_RESEARCH_MODEL || 'openai/gpt-5.5'
const FALLBACK_RESEARCH_MODEL =
  serverEnv.WEEKLY_RESEARCH_FALLBACK_MODEL || 'openai/gpt-5.4'

export interface WeeklyIngestionResult {
  mode: ChatMode
  status: 'complete' | 'failed'
  chunkCount: number
  jobId?: string
  error?: string
}

async function generateResearchSummary(prompt: string, tag: string) {
  try {
    const result = await generateText({
      model: vercelGateway.languageModel(RESEARCH_MODEL),
      prompt,
      providerOptions: {
        gateway: { tags: [`feature:${tag}`, 'mode:weekly-research'] },
      },
    })
    return {
      summary: result.text,
      model: RESEARCH_MODEL,
      rawJson: { usage: result.usage } as Record<string, unknown>,
    }
  } catch (error) {
    console.warn(
      `[WeeklyIngestion] ${RESEARCH_MODEL} failed, falling back to ${FALLBACK_RESEARCH_MODEL}:`,
      error
    )
    const result = await generateText({
      model: vercelGateway.languageModel(FALLBACK_RESEARCH_MODEL),
      prompt,
      providerOptions: {
        gateway: { tags: [`feature:${tag}`, 'mode:fallback-research'] },
      },
    })
    return {
      summary: result.text,
      model: FALLBACK_RESEARCH_MODEL,
      rawJson: {
        usage: result.usage,
        fallbackReason: error instanceof Error ? error.message : String(error),
      } as Record<string, unknown>,
    }
  }
}

/**
 * Generate and ingest the weekly Content-mode research summary.
 *
 * Mirrors `runWeeklyResearch` for SEO/GEO: tracks a `research_jobs` row and
 * ingests the summary into the `content` RAG namespace.
 */
export async function runWeeklyContentResearch(): Promise<WeeklyIngestionResult> {
  const [job] = await db
    .insert(researchJobs)
    .values({ mode: 'content', status: 'processing', startedAt: new Date() })
    .returning()

  try {
    const profileRows = await db.select().from(businessProfiles).limit(20)
    const context = profileRows.map(profile => ({
      industry: profile.industry,
      goals: profile.goals,
    }))

    const prompt = `Create a weekly content-marketing deep research summary for SEOBOT's Content-mode RAG.

This is an aggregated summary. Do NOT include any user-identifying information (user IDs, brand names, or website URLs). Synthesize general patterns and actionable guidance.

Known business profile context (anonymized industries and goals):
${JSON.stringify(context, null, 2)}

Produce structured Markdown with:
- Executive summary
- Content marketing research and trends this week
- Copywriting frameworks worth applying
- EEAT (Experience, Expertise, Authoritativeness, Trust) guidance
- Content formats and structures that are performing well
- Editorial and tone best practices
- Recommended content updates
- Next actions

Keep this strictly focused on content strategy and creation.`

    const summary = await generateResearchSummary(prompt, 'weekly-content-research')

    await db
      .update(researchJobs)
      .set({
        status: 'complete',
        summary: summary.summary,
        rawJson: summary.rawJson as Json,
        completedAt: new Date(),
      })
      .where(eq(researchJobs.id, job.id))

    const ingest = await ingestRagDocument({
      mode: 'content',
      sourceType: 'weekly_research',
      title: `CONTENT weekly research ${new Date().toISOString().slice(0, 10)}`,
      rawMarkdown: summary.summary,
      metadata: { researchJobId: job.id, generatedBy: summary.model },
    })

    return {
      mode: 'content',
      status: 'complete',
      chunkCount: ingest.chunkCount,
      jobId: job.id,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Weekly content research failed'
    await db
      .update(researchJobs)
      .set({ status: 'failed', summary: message, completedAt: new Date() })
      .where(eq(researchJobs.id, job.id))

    return { mode: 'content', status: 'failed', chunkCount: 0, jobId: job.id, error: message }
  }
}

/**
 * Run weekly RAG ingestion for the requested modes.
 *
 * Each mode is run independently — a failure in one mode does not abort the
 * others. Defaults to all three modes.
 */
export async function runWeeklyIngestion(
  modes: ChatMode[] = [...CHAT_MODES]
): Promise<WeeklyIngestionResult[]> {
  const results: WeeklyIngestionResult[] = []

  for (const mode of modes) {
    try {
      if (mode === 'content') {
        results.push(await runWeeklyContentResearch())
        continue
      }

      // mode is narrowed to 'seo' | 'geo' here.
      const research = await runWeeklyResearch(mode)
      results.push({
        mode,
        status: 'complete',
        chunkCount: research.chunkCount,
        jobId: research.jobId,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Weekly ${mode} ingestion failed`
      console.error(`[WeeklyIngestion] ${mode} ingestion failed:`, error)
      results.push({ mode, status: 'failed', chunkCount: 0, error: message })
    }
  }

  return results
}
