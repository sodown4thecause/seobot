import { v4 as uuidv4 } from 'uuid'

import { db } from '@/lib/db'
import { apiUsageEvents, type Json } from '@/lib/db/schema'
import { calculateEndpointCost, type MethodType } from '@/lib/constants/dataforseo-limits'

export interface DataForSeoTrackingContext {
  userId: string
  jobId: string
  endpoint: string
  method: MethodType
}

export interface DataForSeoUsageEventInput extends DataForSeoTrackingContext {
  statusCode: number
  durationMs: number
  taskCount?: number
  metadata?: Record<string, unknown>
}

type TrackedCallResult<T> = {
  data: T
  statusCode: number
  taskCount?: number
  metadata?: Record<string, unknown>
}

type TrackedCallExecutor<T> = () => Promise<TrackedCallResult<T>>

function requireTrackingContext(context: DataForSeoTrackingContext): void {
  if (!context.userId) {
    throw new Error('DataForSEO tracking requires userId')
  }

  if (!context.jobId) {
    throw new Error('DataForSEO tracking requires jobId')
  }
}

function getStatusCodeFromError(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode
    if (typeof statusCode === 'number') {
      return statusCode
    }
  }

  return 0
}

export async function trackDataForSeoCall(input: DataForSeoUsageEventInput): Promise<void> {
  requireTrackingContext(input)

  const taskCount = input.taskCount ?? 1
  const normalizedTaskCount = taskCount > 0 ? taskCount : 1
  const unitCost = calculateEndpointCost(input.endpoint, input.method)

  await db.insert(apiUsageEvents).values({
    id: uuidv4(),
    userId: input.userId,
    jobId: input.jobId,
    provider: 'dataforseo',
    endpoint: input.endpoint,
    method: input.method,
    costUsd: unitCost * normalizedTaskCount,
    metadata: {
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      taskCount: normalizedTaskCount,
      ...(input.metadata ?? {}),
    } as Json,
    createdAt: new Date(),
  })
}

export async function executeTrackedDataForSeoCall<T>(
  context: DataForSeoTrackingContext,
  executor: TrackedCallExecutor<T>
): Promise<T> {
  requireTrackingContext(context)
  const startedAt = Date.now()

  try {
    const result = await executor()

    await trackDataForSeoCall({
      ...context,
      statusCode: result.statusCode,
      durationMs: Date.now() - startedAt,
      taskCount: result.taskCount,
      metadata: {
        tracked: true,
        success: true,
        ...(result.metadata ?? {}),
      },
    })

    return result.data
  } catch (error) {
    await trackDataForSeoCall({
      ...context,
      statusCode: getStatusCodeFromError(error),
      durationMs: Date.now() - startedAt,
      metadata: {
        tracked: true,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown DataForSEO error',
      },
    })

    throw error
  }
}

/**
 * Middleware marker for Inngest client wiring.
 * DataForSEO calls are tracked through executeTrackedDataForSeoCall.
 */
export function costTrackingMiddleware() {
  return () => ({
    name: 'dataforseo-cost-tracking',
  })
}
