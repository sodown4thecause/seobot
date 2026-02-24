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
import { executeAsyncTaskFlow } from '@/lib/dataforseo/client'
import type { DataForSEOResponse } from '@/lib/dataforseo/types'
import { executeRefreshDataTypeWithCircuitBreaker } from '@/lib/jobs/circuit-breaker'
import { invalidateDashboardCache } from '@/lib/cache/redis-client'

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
    let wasCancelled = false
    let skippedDataTypes: string[] = []

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
      if (!dataType) {
        continue
      }

      const cancelledBeforeStep = await isJobCancelled(jobId)
      if (cancelledBeforeStep) {
        wasCancelled = true
        skippedDataTypes = dataTypes.slice(i)
        break
      }

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
          const data = await refreshDataByType(dataType, userId, websiteUrl, jobId, competitorUrls, () => isJobCancelled(jobId))

          if (await isJobCancelled(jobId)) {
            throw new JobCancelledError(`Job ${jobId} was cancelled after ${dataType}`)
          }

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
        if (error instanceof JobCancelledError) {
          wasCancelled = true
          skippedDataTypes = dataTypes.slice(i + 1)
          break
        }

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
      if (wasCancelled) {
        await setJobCancelled(jobId, skippedDataTypes)
        await invalidateDashboardCache(userId)

        console.log(`[RefreshJob] Cancelled job ${jobId}`)

        return { jobId, status: 'cancelled', skippedDataTypes }
      }

      await db
        .update(refreshJobs)
        .set({
          status: 'complete',
          progress: 100,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refreshJobs.id, jobId))

      await invalidateDashboardCache(userId)

      console.log(`[RefreshJob] Completed job ${jobId}`)

      return { jobId, status: 'complete' }
    })

    return {
      jobId,
      userId,
      dataTypes,
      status: wasCancelled ? 'cancelled' : 'complete',
      skippedDataTypes,
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
 */
async function refreshDataByType(
  dataType: string,
  userId: string,
  websiteUrl: string,
  jobId: string,
  competitorUrls?: string[],
  shouldCancel?: () => Promise<boolean>
): Promise<Json> {
  console.log(`[RefreshJob] Refreshing ${dataType} for ${websiteUrl}`)

  const endpointConfig = getDataTypeEndpointConfig(dataType)
  const taskPayload = buildTaskPayload(dataType, websiteUrl, competitorUrls)

  const maxAttempts = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (shouldCancel && (await shouldCancel())) {
        throw new JobCancelledError(`Job ${jobId} cancelled before ${dataType} attempt ${attempt + 1}`)
      }

      const response = await executeRefreshDataTypeWithCircuitBreaker<DataForSEOResponse<Json>>({
        endpoint: endpointConfig.submitEndpoint,
        userId,
        jobId,
        dataType,
        timeoutMs: 90000,
        execute: () =>
          executeAsyncTaskFlow<Json>({
            submitEndpoint: endpointConfig.submitEndpoint,
            tasksReadyEndpoint: endpointConfig.tasksReadyEndpoint,
            resultEndpoint: endpointConfig.resultEndpoint,
            tasks: [taskPayload],
            tracking: {
              userId,
              jobId,
            },
            refreshTrigger: 'manual',
            pollIntervalMs: 3000,
            timeoutMs: 60000,
            resultHttpMethod: endpointConfig.resultHttpMethod,
          }),
      })

      if (!response.success || !response.data?.tasks) {
        throw new Error(response.error?.message || `DataForSEO ${dataType} refresh failed`)
      }

      if (shouldCancel && (await shouldCancel())) {
        throw new JobCancelledError(`Job ${jobId} cancelled after ${dataType} polling`)
      }

      return {
        provider: 'dataforseo',
        dataType,
        fetchedAt: new Date().toISOString(),
        sourceEndpoint: endpointConfig.submitEndpoint,
        taskCount: response.data.tasks.length,
        tasks: response.data.tasks.map((task: { id?: string; status?: string; result?: Json; error?: unknown }) => ({
          id: task.id,
          status: task.status,
          result: task.result,
          error: serializeTaskError(task.error),
        })),
      }
    } catch (error) {
      if (error instanceof JobCancelledError) {
        throw error
      }

      lastError = error instanceof Error ? error : new Error('Unknown refresh error')

      if (attempt === maxAttempts - 1) {
        break
      }

      const backoffMs = getExponentialBackoffMs(attempt)
      console.warn(
        `[RefreshJob] Retry ${attempt + 1}/${maxAttempts - 1} for ${dataType} in ${backoffMs}ms due to: ${lastError.message}`
      )
      await sleep(backoffMs)
    }
  }

  throw lastError || new Error(`Refresh failed for ${dataType}`)
}

class JobCancelledError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JobCancelledError'
  }
}

async function isJobCancelled(jobId: string): Promise<boolean> {
  const job = await db
    .select({ status: refreshJobs.status })
    .from(refreshJobs)
    .where(eq(refreshJobs.id, jobId))
    .limit(1)

  return job[0]?.status === 'cancelled'
}

async function setJobCancelled(jobId: string, skipped: string[]): Promise<void> {
  const existing = await db
    .select({ metadata: refreshJobs.metadata })
    .from(refreshJobs)
    .where(eq(refreshJobs.id, jobId))
    .limit(1)

  const metadata =
    existing[0]?.metadata && typeof existing[0].metadata === 'object' && !Array.isArray(existing[0].metadata)
      ? existing[0].metadata
      : {}

  await db
    .update(refreshJobs)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
      completedAt: new Date(),
      metadata: {
        ...metadata,
        cancelledAt: new Date().toISOString(),
        skippedDataTypes: skipped,
      },
    })
    .where(and(eq(refreshJobs.id, jobId), eq(refreshJobs.status, 'cancelled')))
}

type DataTypeEndpointConfig = {
  submitEndpoint: string
  tasksReadyEndpoint: string
  resultEndpoint: string | ((taskId: string) => string)
  resultHttpMethod?: 'GET' | 'POST'
}

function getDataTypeEndpointConfig(dataType: string): DataTypeEndpointConfig {
  switch (dataType) {
    case 'overview':
    case 'ranks':
      return {
        submitEndpoint: 'serp/organic/task_post',
        tasksReadyEndpoint: 'serp/organic/tasks_ready',
        resultEndpoint: (taskId) => `serp/organic/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
    case 'backlinks':
      return {
        submitEndpoint: 'backlinks/backlinks/task_post',
        tasksReadyEndpoint: 'backlinks/backlinks/tasks_ready',
        resultEndpoint: (taskId) => `backlinks/backlinks/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
    case 'audit':
      return {
        submitEndpoint: 'onpage/summary/task_post',
        tasksReadyEndpoint: 'onpage/summary/tasks_ready',
        resultEndpoint: (taskId) => `onpage/summary/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
    case 'keywords':
      return {
        submitEndpoint: 'keywords_data/google/search_volume/task_post',
        tasksReadyEndpoint: 'keywords_data/google/search_volume/tasks_ready',
        resultEndpoint: (taskId) => `keywords_data/google/search_volume/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
    case 'aeo':
      return {
        submitEndpoint: 'ai_optimization/keyword_data/task_post',
        tasksReadyEndpoint: 'ai_optimization/keyword_data/tasks_ready',
        resultEndpoint: (taskId) => `ai_optimization/keyword_data/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
    case 'content':
      return {
        submitEndpoint: 'content_analysis/summary/task_post',
        tasksReadyEndpoint: 'content_analysis/summary/tasks_ready',
        resultEndpoint: (taskId) => `content_analysis/summary/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
    default:
      return {
        submitEndpoint: 'serp/organic/task_post',
        tasksReadyEndpoint: 'serp/organic/tasks_ready',
        resultEndpoint: (taskId) => `serp/organic/task_get/${taskId}`,
        resultHttpMethod: 'GET',
      }
  }
}

function buildTaskPayload(dataType: string, websiteUrl: string, competitorUrls?: string[]): Record<string, unknown> {
  return {
    target: websiteUrl,
    keyword: websiteUrl,
    language_code: 'en',
    location_code: 2840,
    limit: 100,
    include_subdomains: true,
    competitors: competitorUrls || [],
    data_type: dataType,
  }
}

function getExponentialBackoffMs(attempt: number): number {
  const baseDelayMs = 1000
  const maxDelayMs = 30000
  const backoff = baseDelayMs * 2 ** attempt
  return Math.min(maxDelayMs, backoff)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function serializeTaskError(error: unknown): Json {
  if (!error) {
    return null
  }

  if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
    return error
  }

  if (Array.isArray(error)) {
    return error as Json
  }

  if (typeof error === 'object') {
    return error as Json
  }

  return String(error)
}
