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
// Cost Tracking Middleware
// ============================================================================

interface CostContext {
  userId: string
  jobId?: string
  endpoint: string
  method: 'standard' | 'live'
}

/**
 * DataForSEO Cost Calculator
 * Based on official pricing as of 2026-02-24
 */
export function calculateCost(endpoint: string, method: 'standard' | 'live'): number {
  // SERP endpoints
  if (endpoint.includes('serp')) {
    return method === 'live' ? 0.005 : 0.001
  }

  // Backlinks endpoints
  if (endpoint.includes('backlinks')) {
    return 0.01
  }

  // Keywords data
  if (endpoint.includes('keywords')) {
    return 0.001
  }

  // Domain analytics
  if (endpoint.includes('domain')) {
    return 0.001
  }

  // Content analysis
  if (endpoint.includes('content')) {
    return 0.001
  }

  // Default pricing
  return 0.001
}

/**
 * Cost tracking middleware for Inngest
 * Wraps job execution to track API costs
 */
export const costTrackingMiddleware = () => {
  return async ({ context, next }: { context: { userId: string; jobId?: string }; next: () => Promise<unknown> }) => {
    const startTime = Date.now()

    try {
      const result = await next()
      return result
    } finally {
      const duration = Date.now() - startTime

      // Log execution time for monitoring
      console.log(`[Inngest] Job completed in ${duration}ms for user ${context.userId}`)
    }
  }
}

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
