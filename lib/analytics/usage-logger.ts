/**
 * Usage Logger for AI Usage Events
 * Logs AI calls to ai_usage_events table with cost estimates
 * 
 * Migrated from Supabase to Drizzle ORM with Neon
 * Performance: Uses in-memory queue with batch processing to reduce DB load
 */

import { db } from '@/lib/db'
import { aiUsageEvents, type Json } from '@/lib/db/schema'
import { estimateCost, extractProviderFromModel, type AIProvider } from './cost-estimator'

export interface UsageLogParams {
  userId: string | null | undefined
  conversationId?: string | null
  messageId?: string | null
  agentType?: string
  model: string
  promptTokens?: number
  completionTokens?: number
  toolCalls?: number
  provider?: AIProvider
  endpoint?: string
  metadata?: Record<string, any>
}

interface QueuedUsageEvent {
  userId: string
  conversationId?: string
  messageId?: string
  agentType?: string
  model: string
  promptTokens: number
  completionTokens: number
  toolCalls: number
  metadata: Json
}

// In-memory queue for batching usage events
class UsageEventQueue {
  private queue: QueuedUsageEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly maxQueueSize = 100
  private readonly flushIntervalMs = 5000 // 5 seconds
  private isFlushing = false

  constructor() {
    // Start background flush worker
    this.startFlushWorker()
  }

  /**
   * Add event to queue
   */
  enqueue(event: QueuedUsageEvent): void {
    this.queue.push(event)
    
    // Flush immediately if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush().catch(error => {
        console.error('[UsageQueue] Emergency flush failed:', error)
      })
    }
  }

  /**
   * Start periodic flush worker
   */
  private startFlushWorker(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    this.flushInterval = setInterval(() => {
      this.flush().catch(error => {
        console.error('[UsageQueue] Scheduled flush failed:', error)
      })
    }, this.flushIntervalMs)

    // Ensure cleanup on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        this.flush().catch(error => {
          console.error('[UsageQueue] Final flush failed:', error)
        })
      })
    }
  }

  /**
   * Flush queued events to database
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return
    }

    this.isFlushing = true
    const eventsToFlush = [...this.queue]
    this.queue = [] // Clear queue immediately

    try {
      await db.insert(aiUsageEvents).values(eventsToFlush)
      console.log(`[UsageQueue] Flushed ${eventsToFlush.length} usage events to database`)
    } catch (error) {
      console.error('[UsageQueue] Failed to flush events:', error)
      // Re-queue failed events (at the front to preserve order)
      this.queue.unshift(...eventsToFlush)
    } finally {
      this.isFlushing = false
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Stop the flush worker
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}

// Singleton queue instance
const usageQueue = new UsageEventQueue()

/**
 * Log an AI usage event to the queue (non-blocking)
 */
export async function logAIUsage(params: UsageLogParams): Promise<void> {
  try {
    if (!params.userId) {
      // Skip logging if no user ID (e.g., public endpoints)
      return
    }

    // Determine provider
    const provider = params.provider || extractProviderFromModel(params.model)
    
    // Estimate cost
    const costUsd = estimateCost({
      provider,
      model: params.model,
      promptTokens: params.promptTokens || 0,
      completionTokens: params.completionTokens || 0,
      toolCalls: params.toolCalls || 0,
      endpoint: params.endpoint,
      metadata: params.metadata,
    })

    // Prepare metadata with provider and cost
    const metadata = {
      ...params.metadata,
      provider,
      cost_usd: costUsd,
      endpoint: params.endpoint,
    }

    // Enqueue event for batch processing
    usageQueue.enqueue({
      userId: params.userId,
      conversationId: params.conversationId || undefined,
      messageId: params.messageId || undefined,
      agentType: params.agentType || undefined,
      model: params.model,
      promptTokens: params.promptTokens || 0,
      completionTokens: params.completionTokens || 0,
      toolCalls: params.toolCalls || 0,
      metadata: metadata as Json,
    })

    console.log(`[Usage Logger] Queued ${provider} usage: ${params.model} (${costUsd.toFixed(4)} USD) - Queue size: ${usageQueue.getQueueSize()}`)
  } catch (error) {
    console.error('[Usage Logger] Error queueing AI usage:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Force flush all pending events (useful for testing or shutdown)
 */
export async function flushUsageQueue(): Promise<void> {
  await usageQueue.flush()
}

/**
 * Get current queue size (useful for monitoring)
 */
export function getUsageQueueSize(): number {
  return usageQueue.getQueueSize()
}

/**
 * Extract usage from AI SDK result
 */
export function extractUsageFromResult(result: any): {
  promptTokens: number
  completionTokens: number
  toolCalls: number
} {
  // Compute tool calls once to avoid redundant iteration
  const toolCalls = result.steps?.reduce((sum: number, step: any) => sum + (step.toolCalls?.length || 0), 0) || 0

  // AI SDK 6 format
  if (result.usage) {
    return {
      promptTokens: result.usage.promptTokens || 0,
      completionTokens: result.usage.completionTokens || 0,
      toolCalls,
    }
  }

  // Fallback: try to extract from response
  if (result.response?.usage) {
    return {
      promptTokens: result.response.usage.promptTokens || 0,
      completionTokens: result.response.usage.completionTokens || 0,
      toolCalls,
    }
  }

  // Default: return zeros (will use conservative estimate)
  return {
    promptTokens: 0,
    completionTokens: 0,
    toolCalls: 0,
  }
}

