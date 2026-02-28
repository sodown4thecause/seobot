/**
 * Inngest Client for Dashboard Job Orchestration
 *
 * Provides durable background job processing for dashboard data refresh.
 * Integrates with DataForSEO MCP tools with cost tracking and circuit breaker protection.
 *
 * @module lib/jobs/inngest-client
 */

import { Inngest } from 'inngest'
import { z } from 'zod'

import { costTrackingMiddleware, executeTrackedDataForSeoCall } from '@/lib/jobs/middleware/cost-tracking'

// ============================================================================
// Environment Validation
// ============================================================================

const envSchema = z.object({
  INNGEST_EVENT_KEY: z.string().min(1, 'INNGEST_EVENT_KEY is required'),
  INNGEST_SIGNING_KEY: z.string().min(1, 'INNGEST_SIGNING_KEY is required'),
})

const env = envSchema.parse(process.env)

// ============================================================================
// Event Schemas
// ============================================================================

/**
 * Dashboard refresh requested event
 * Triggered when user clicks "Refresh Now" or cron job fires
 */
export const refreshRequestedSchema = z.object({
  data: z.object({
    userId: z.string(),
    websiteUrl: z.string().url(),
    jobType: z.enum(['full-refresh', 'ranks-only', 'backlinks-only', 'audit-only', 'overview-only']),
    competitorUrls: z.array(z.string().url()).optional(),
  }),
})

export type RefreshRequestedEvent = z.infer<typeof refreshRequestedSchema>

/**
 * Dashboard refresh progress event
 * Emitted during job execution for real-time status updates
 */
export const refreshProgressSchema = z.object({
  data: z.object({
    jobId: z.string().uuid(),
    userId: z.string(),
    progress: z.number().min(0).max(100),
    status: z.enum(['queued', 'processing', 'complete', 'failed', 'cancelled']),
    message: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
})

export type RefreshProgressEvent = z.infer<typeof refreshProgressSchema>

/**
 * Dashboard refresh completed event
 * Emitted when job finishes successfully
 */
export const refreshCompletedSchema = z.object({
  data: z.object({
    jobId: z.string().uuid(),
    userId: z.string(),
    dataTypes: z.array(z.string()), // ['ranks', 'backlinks', 'overview', etc.]
    totalCost: z.number().optional(),
    durationMs: z.number(),
  }),
})

export type RefreshCompletedEvent = z.infer<typeof refreshCompletedSchema>

/**
 * Dashboard refresh failed event
 * Emitted when job encounters an error
 */
export const refreshFailedSchema = z.object({
  data: z.object({
    jobId: z.string().uuid(),
    userId: z.string(),
    error: z.string(),
    errorCode: z.string().optional(),
    retryable: z.boolean().default(true),
    metadata: z.record(z.unknown()).optional(),
  }),
})

export type RefreshFailedEvent = z.infer<typeof refreshFailedSchema>

// ============================================================================
// Inngest Client
// ============================================================================

/**
 * Singleton Inngest client instance
 * Do NOT create multiple instances
 */
export const inngest = new Inngest({
  id: 'seobot-dashboard',
  name: 'SEOBOT Dashboard Jobs',
  eventKey: env.INNGEST_EVENT_KEY,
  middleware: [costTrackingMiddleware],
})

// ============================================================================
// Event Type Definitions (for TypeScript inference)
// ============================================================================

export const events = {
  'dashboard/refresh.requested': {
    schema: refreshRequestedSchema,
  },
  'dashboard/refresh.progress': {
    schema: refreshProgressSchema,
  },
  'dashboard/refresh.completed': {
    schema: refreshCompletedSchema,
  },
  'dashboard/refresh.failed': {
    schema: refreshFailedSchema,
  },
}

export type Events = typeof events

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Send refresh requested event
 * Called when user clicks "Refresh Now" button
 */
export async function sendRefreshRequest(
  userId: string,
  websiteUrl: string,
  jobType: RefreshRequestedEvent['data']['jobType'],
  competitorUrls?: string[]
): Promise<void> {
  await inngest.send({
    name: 'dashboard/refresh.requested',
    data: {
      userId,
      websiteUrl,
      jobType,
      competitorUrls,
    },
  })
}

/**
 * Send progress update
 * Called during job execution
 */
export async function sendProgressUpdate(
  jobId: string,
  userId: string,
  progress: number,
  status: RefreshProgressEvent['data']['status'],
  message?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await inngest.send({
    name: 'dashboard/refresh.progress',
    data: {
      jobId,
      userId,
      progress,
      status,
      message,
      metadata,
    },
  })
}

// Export for use in job functions
export { env as inngestEnv }
export { executeTrackedDataForSeoCall }
