/**
 * Error Logger
 * 
 * Logs errors with metadata for monitoring and debugging.
 * Can be extended to send logs to Axiom or other logging services.
 */

import { getErrorMetadata } from './types'
import { appLogger } from '@/lib/observability/app-logger'

export interface ErrorLogEntry {
  timestamp: string
  level: 'error' | 'warn'
  error: {
    name: string
    message: string
    code?: string
    statusCode?: number
    stack?: string
  }
  context: {
    agent?: string
    provider?: string
    requestId?: string
    userId?: string
    endpoint?: string
    retryable?: boolean
  }
  metadata?: Record<string, unknown>
}

/**
 * Log an error with context
 * 
 * @param error - The error to log
 * @param context - Additional context (agent, provider, requestId, etc.)
 */
export async function logError(
  error: unknown,
  context?: {
    agent?: string
    provider?: string
    requestId?: string
    userId?: string
    endpoint?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    const errorMetadata = getErrorMetadata(error)
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: errorMetadata.statusCode && errorMetadata.statusCode >= 500 ? 'error' : 'warn',
      error: {
        name: errorMetadata.name,
        message: errorMetadata.message,
        code: errorMetadata.code,
        statusCode: errorMetadata.statusCode,
        stack: errorMetadata.stack,
      },
      context: {
        agent: context?.agent || errorMetadata.agent,
        provider: context?.provider || errorMetadata.provider,
        requestId: context?.requestId || errorMetadata.requestId,
        userId: context?.userId,
        endpoint: context?.endpoint,
        retryable: errorMetadata.retryable,
      },
      metadata: context?.metadata,
    }

    // Structured logging (stdout → Vercel → Axiom drain)
    if (logEntry.level === 'error') {
      appLogger.error(logEntry.error.message, {
        endpoint: logEntry.context.endpoint,
        userId: logEntry.context.userId,
        agentType: logEntry.context.agent,
        metadata: {
          ...logEntry.metadata,
          error: logEntry.error,
          context: logEntry.context,
        },
      })
    } else {
      appLogger.warn(logEntry.error.message, {
        endpoint: logEntry.context.endpoint,
        userId: logEntry.context.userId,
        agentType: logEntry.context.agent,
        metadata: {
          ...logEntry.metadata,
          error: logEntry.error,
          context: logEntry.context,
        },
      })
    }

    // Sentry for server-side errors (5xx and agent failures)
    if (logEntry.level === 'error' && (logEntry.error.statusCode ?? 500) >= 500) {
      void import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(new Error(logEntry.error.message), {
          tags: {
            agent: logEntry.context.agent,
            provider: logEntry.context.provider,
            endpoint: logEntry.context.endpoint,
          },
          extra: {
            code: logEntry.error.code,
            statusCode: logEntry.error.statusCode,
            userId: logEntry.context.userId,
            metadata: logEntry.metadata,
          },
        })
      })
    }
  } catch (logError) {
    // Don't throw if logging fails
    console.error('[ErrorLogger] Failed to log error:', logError)
  }
}

/**
 * Log agent execution with error handling
 * 
 * @param agentName - Name of the agent
 * @param fn - Agent function to execute
 * @param context - Additional context
 */
export async function logAgentExecution<T>(
  agentName: string,
  fn: () => Promise<T>,
  context?: {
    provider?: string
    requestId?: string
    userId?: string
    metadata?: Record<string, unknown>
  }
): Promise<T> {
  const requestId = context?.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  
  try {
    const result = await fn()
    return result
  } catch (error) {
    await logError(error, {
      agent: agentName,
      provider: context?.provider,
      requestId,
      userId: context?.userId,
      metadata: context?.metadata,
    })
    throw error
  }
}

