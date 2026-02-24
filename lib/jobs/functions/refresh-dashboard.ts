/**
 * Refresh Dashboard Job Function
 *
 * Handles background refresh of dashboard data using DataForSEO APIs.
 * Integrates with circuit breaker pattern and cost tracking.
 *
 * @module lib/jobs/functions/refresh-dashboard
 */

import { inngest, type RefreshRequestedEvent } from '@/lib/jobs/inngest-client'
import { db } from '@/lib/db'
import { refreshJobs, dashboardData, apiUsageEvents, type Json } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// Job Configuration
// ============================================================================

/**
 * Dashboard refresh job definition
 *
 * Triggered by: 'dashboard/refresh.requested' event
 * Retries: 3 times with exponential backoff
 * Timeout: 5 minutes (300 seconds)
 */
export const refreshDashboardJob = inngest.createFunction(
  {
    id: 'refresh-dashboard',
    name: 'Refresh Dashboard Data',
    retries: 3,
    // Note: Inngest v3 uses `timeout` in milliseconds or as string like "5m"
    // For Vercel, we need streaming mode for long jobs
  },
  { event: 'dashboard/refresh.requested' },
  async ({ event, step }: { event: RefreshRequestedEvent; step: { run: <R>(name: string, fn: () => Promise<R>) => Promise<R> } }) => {
    const { userId, websiteUrl, jobType, competitorUrls } = event.data
    const jobId = uuidv4()

    console.log(`[RefreshJob] Starting ${jobType} for user ${userId}, job ${jobId}`)

    // ============================================================================
    // Step 1: Create job record
    // ============================================================================
    await step.run('create-job-record', async () => {
      await db.insert(refreshJobs).values({
        id: jobId,
        userId,
        jobType,
        status: 'processing',
        progress: 0,
        metadata: {
          websiteUrl,
          competitorUrls,
          startedAt: new Date().toISOString(),
        },
        startedAt: new Date(),
      })

      return { jobId, status: 'created' }
    })

    // ============================================================================
    // Step 2: Determine data types to refresh
    // ============================================================================
    const dataTypes = getDataTypesForJobType(jobType)
    const totalSteps = dataTypes.length + 2 // +2 for create and finalize

    // ============================================================================
    // Step 3: Refresh each data type
    // ============================================================================
    for (let i = 0; i < dataTypes.length; i++) {
      const dataType = dataTypes[i]
      const progress = Math.round(((i + 2) / totalSteps) * 100)

      try {
        await step.run(`refresh-${dataType}`, async () => {
          // Update progress
          await db
            .update(refreshJobs)
            .set({
              progress,
              updatedAt: new Date(),
            })
            .where(eq(refreshJobs.id, jobId))

          // Refresh data based on type
          const data = await refreshDataByType(dataType, userId, websiteUrl, competitorUrls)

          // Store in dashboard_data table
          await db
            .insert(dashboardData)
            .values({
              id: uuidv4(),
              userId,
              websiteUrl,
              dataType,
              data,
              lastUpdated: new Date(),
              freshness: 'fresh',
            })
            .onConflictDoUpdate({
              target: [dashboardData.userId, dashboardData.dataType],
              set: {
                data,
                lastUpdated: new Date(),
                freshness: 'fresh',
                updatedAt: new Date(),
              },
            })

          return { dataType, status: 'refreshed' }
        })
      } catch (error) {
        console.error(`[RefreshJob] Error refreshing ${dataType}:`, error)

        // Log error but continue with other data types
        await step.run(`log-error-${dataType}`, async () => {
          await db.insert(apiUsageEvents).values({
            id: uuidv4(),
            userId,
            jobId,
            provider: 'dataforseo',
            endpoint: dataType,
            method: 'standard',
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              websiteUrl,
            },
            createdAt: new Date(),
          })
        })
      }
    }

    // ============================================================================
    // Step 4: Finalize job
    // ============================================================================
    await step.run('finalize-job', async () => {
      await db
        .update(refreshJobs)
        .set({
          status: 'complete',
          progress: 100,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refreshJobs.id, jobId))

      console.log(`[RefreshJob] Completed job ${jobId}`)

      return { jobId, status: 'complete' }
    })

    return {
      jobId,
      userId,
      dataTypes,
      status: 'complete',
    }
  }
)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get data types to refresh based on job type
 */
function getDataTypesForJobType(jobType: string): string[] {
  switch (jobType) {
    case 'full-refresh':
      return ['overview', 'ranks', 'backlinks', 'audit', 'keywords', 'aeo', 'content']
    case 'ranks-only':
      return ['ranks']
    case 'backlinks-only':
      return ['backlinks']
    case 'audit-only':
      return ['audit']
    case 'overview-only':
      return ['overview']
    default:
      return ['overview']
  }
}

/**
 * Refresh data for a specific data type
 *
 * This is a placeholder that will be implemented in later phases.
 * For now, returns mock data structure.
 */
async function refreshDataByType(
  dataType: string,
  userId: string,
  websiteUrl: string,
  competitorUrls?: string[]
): Promise<Json> {
  // TODO: Integrate with DataForSEO MCP tools in Plan 01-03
  // This will call the actual DataForSEO APIs through MCP wrappers

  console.log(`[RefreshJob] Refreshing ${dataType} for ${websiteUrl}`)

  // Placeholder return with structure that matches expected dashboard format
  switch (dataType) {
    case 'overview':
      return {
        healthScore: 0,
        metrics: {
          organicTraffic: 0,
          rankingKeywords: 0,
          backlinkCount: 0,
          contentPieces: 0,
          aeoMentions: 0,
          competitorPosition: 0,
        },
        changes: [],
      }
    case 'ranks':
      return {
        keywords: [],
        positions: {},
        history: {},
      }
    case 'backlinks':
      return {
        totalBacklinks: 0,
        referringDomains: 0,
        newLinks: [],
        lostLinks: [],
        topReferrers: [],
      }
    case 'audit':
      return {
        technicalScore: 0,
        issues: [],
        warnings: [],
        recommendations: [],
      }
    case 'keywords':
      return {
        opportunities: [],
        gaps: [],
        trending: [],
      }
    case 'aeo':
      return {
        citations: {},
        featuredSnippets: [],
        peopleAlsoAsk: [],
      }
    case 'content':
      return {
        topPages: [],
        decayingContent: [],
        publishingVelocity: 0,
      }
    default:
      return {}
  }
}
