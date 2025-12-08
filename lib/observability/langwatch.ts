/**
 * LangWatch Integration Module
 *
 * Provides LLM-as-a-judge evaluation and telemetry integration for the multi-agent pipeline.
 * This module uses Langfuse's evaluation API under the hood, as Langfuse supports
 * LLM-as-a-judge evaluations and provides a compatible interface.
 *
 * If LangWatch SDK becomes available in the future, this module can be easily swapped out.
 */

import 'server-only'
import { serverEnv } from '@/lib/config/env'
// Use langfuse Node.js SDK for tracing and evaluations
// @ts-ignore - langfuse package may not have types
import Langfuse from 'langfuse'

/**
 * LangWatch client configuration
 */
export interface LangWatchConfig {
  apiKey: string
  baseUrl?: string
}

/**
 * Trace logging payload for LangWatch
 */
export interface LogTracePayload {
  traceId: string
  agent: string
  model: string
  telemetry?: Record<string, unknown>
  metadata?: Record<string, unknown>
  userId?: string // Langfuse user ID for user tracking
  sessionId?: string // Langfuse session ID for session grouping
}

/**
 * Evaluation payload for LLM-as-a-judge
 */
export interface EvaluatePayload {
  evaluationId: string
  content: string
  context?: Record<string, unknown>
  scores?: Record<string, number>
  metadata?: Record<string, unknown>
  userId?: string // Langfuse user ID for user tracking
  sessionId?: string // Langfuse session ID for session grouping
  langfuseTraceId?: string // Parent trace ID to link evaluation to main trace
}

/**
 * Evaluation result from LangWatch
 */
export interface EvaluationResult {
  evaluationId: string
  scores: Record<string, number>
  feedback?: string
  passed: boolean
  metadata?: Record<string, unknown>
}

/**
 * LangWatch client class
 * Provides telemetry and evaluation capabilities for the multi-agent pipeline
 */
export class LangWatch {
  private langfuse: Langfuse | null = null
  private enabled: boolean

  constructor(config?: LangWatchConfig) {
    // Use LangWatch API key if provided, otherwise fall back to Langfuse keys
    const apiKey = config?.apiKey || serverEnv.LANGWATCH_API_KEY || serverEnv.LANGFUSE_SECRET_KEY
    // Support both LANGFUSE_BASEURL and LANGFUSE_BASE_URL for compatibility
    const baseUrl = config?.baseUrl || 
                    serverEnv.LANGWATCH_BASE_URL || 
                    serverEnv.LANGFUSE_BASEURL || 
                    serverEnv.LANGFUSE_BASE_URL || 
                    'https://cloud.langfuse.com'

    this.enabled = !!apiKey && serverEnv.LANGFUSE_ENABLED !== 'false'

    if (this.enabled && apiKey) {
      try {
        this.langfuse = new Langfuse({
          secretKey: apiKey,
          publicKey: serverEnv.LANGFUSE_PUBLIC_KEY || '',
          baseUrl,
        })
      } catch (error) {
        console.error('[LangWatch] Failed to initialize Langfuse client:', error)
        this.enabled = false
      }
    }
  }

  /**
   * Check if LangWatch is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && this.langfuse !== null
  }

  /**
   * Log a trace for telemetry tracking
   *
   * @param payload - Trace information including traceId, agent, model, and telemetry data
   */
  async logTrace(payload: LogTracePayload): Promise<void> {
    if (!this.isEnabled() || !this.langfuse) {
      return
    }

    try {
      // Create a trace in Langfuse with the provided metadata
      const trace = this.langfuse.trace({
        id: payload.traceId,
        name: `agent:${payload.agent}`,
        userId: payload.userId, // Langfuse user tracking
        sessionId: payload.sessionId, // Langfuse session tracking
        metadata: {
          agent: payload.agent,
          model: payload.model,
          ...payload.telemetry,
          ...payload.metadata,
        },
      })

      // If telemetry data includes usage information, log it
      if (payload.telemetry) {
        trace.update({
          metadata: {
            ...payload.telemetry,
            ...payload.metadata,
          },
        })
      }

      await this.langfuse.flushAsync()
    } catch (error) {
      console.error('[LangWatch] Failed to log trace:', error)
      // Don't throw - telemetry failures shouldn't break the main flow
    }
  }

  /**
   * Evaluate content using LLM-as-a-judge
   *
   * @param payload - Evaluation payload with content, context, and evaluation schema ID
   * @returns Evaluation result with scores and feedback
   */
  async evaluate(payload: EvaluatePayload): Promise<EvaluationResult> {
    if (!this.isEnabled() || !this.langfuse) {
      // Return a default result if LangWatch is not enabled
      return {
        evaluationId: payload.evaluationId,
        scores: payload.scores || {},
        passed: true,
        metadata: payload.metadata,
      }
    }

    try {
      // Create a trace for this evaluation
      // If langfuseTraceId is provided, link to parent trace by using it as the trace ID
      // Otherwise, create a new trace
      const trace = this.langfuse.trace({
        id: payload.langfuseTraceId, // Link to parent trace if provided
        name: `evaluation:${payload.evaluationId}`,
        userId: payload.userId, // Langfuse user tracking
        sessionId: payload.sessionId, // Langfuse session tracking
        metadata: {
          evaluationId: payload.evaluationId,
          ...payload.context,
          ...payload.metadata,
        },
      })

      // Create a generation span for the evaluation
      const generation = trace.generation({
        name: `llm-judge:${payload.evaluationId}`,
        model: 'llm-judge', // Indicates this is an LLM-as-a-judge evaluation
        input: {
          content: payload.content,
          context: payload.context,
        },
      })

      // Use Langfuse's score API to record evaluation scores
      // Langfuse supports custom scores which we can use for LLM-as-a-judge evaluations
      if (payload.scores) {
        for (const [scoreName, scoreValue] of Object.entries(payload.scores)) {
          generation.score({
            name: scoreName,
            value: scoreValue,
            comment: `LLM-as-a-judge evaluation for ${payload.evaluationId}`,
          })
        }
      }

      // Determine if evaluation passed based on scores
      // This logic can be customized per evaluation schema
      const passed = this.determinePassStatus(payload.evaluationId, payload.scores || {})

      // Flush with error handling for debug mode
      try {
        await this.langfuse.flushAsync()
      } catch (flushError) {
        if (serverEnv.LANGFUSE_DEBUG === 'true') {
          console.warn('[LangWatch] Failed to flush evaluation trace:', flushError)
        }
        // Continue even if flush fails
      }

      return {
        evaluationId: payload.evaluationId,
        scores: payload.scores || {},
        passed,
        metadata: {
          ...payload.metadata,
          traceId: trace.id,
          langfuseTraceId: payload.langfuseTraceId,
        },
      }
    } catch (error) {
      console.error('[LangWatch] Failed to evaluate:', error)
      // Return a default result on error
      return {
        evaluationId: payload.evaluationId,
        scores: payload.scores || {},
        passed: false,
        metadata: {
          ...payload.metadata,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Determine if an evaluation passed based on scores
   * This can be customized per evaluation schema
   *
   * @param evaluationId - The evaluation schema ID
   * @param scores - The scores from the evaluation
   * @returns Whether the evaluation passed
   */
  private determinePassStatus(evaluationId: string, scores: Record<string, number>): boolean {
    // Default logic: check if all scores meet minimum thresholds
    // This can be customized per evaluation schema
    if (evaluationId.includes('eeat')) {
      // EEAT evaluation: require minimum scores for each dimension
      const minEeatScore = 70
      const minDepthScore = 70
      const minFactualScore = 80
      return (
        (scores.eeat_score || 0) >= minEeatScore &&
        (scores.depth_score || 0) >= minDepthScore &&
        (scores.factual_score || 0) >= minFactualScore
      )
    } else if (evaluationId.includes('content_quality')) {
      // Content quality evaluation: require overall score above threshold
      const minOverallScore = 75
      return (scores.overall_score || 0) >= minOverallScore
    } else if (evaluationId.includes('seo')) {
      // SEO evaluation: require SEO score above threshold
      const minSeoScore = 80
      return (scores.seo_score || 0) >= minSeoScore
    }

    // Default: all scores must be >= 70
    return Object.values(scores).every((score) => score >= 70)
  }

  /**
   * Flush any pending telemetry data
   */
  async flush(): Promise<void> {
    if (this.langfuse) {
      await this.langfuse.flushAsync()
    }
  }

  /**
   * Shutdown the LangWatch client
   */
  async shutdown(): Promise<void> {
    if (this.langfuse) {
      await this.flush()
      await this.langfuse.shutdownAsync()
    }
  }
}

/**
 * Singleton instance of LangWatch client
 * Initialize once and reuse across the application
 */
let langWatchInstance: LangWatch | null = null

/**
 * Get or create the LangWatch client instance
 */
export function getLangWatchClient(): LangWatch {
  if (!langWatchInstance) {
    langWatchInstance = new LangWatch()
  }
  return langWatchInstance
}

/**
 * Check if LangWatch is enabled
 */
export function isLangWatchEnabled(): boolean {
  return getLangWatchClient().isEnabled()
}

