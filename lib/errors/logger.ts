/**
 * Error Logger
 * 
 * Logs errors with metadata for monitoring and debugging.
 * Can be extended to send logs to Axiom or other logging services.
 */

import { getErrorMetadata, AppError } from './types'

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

    // Console logging (can be extended to Axiom)
    if (logEntry.level === 'error') {
      console.error('[ErrorLogger]', JSON.stringify(logEntry, null, 2))
    } else {
      console.warn('[ErrorLogger]', JSON.stringify(logEntry, null, 2))
    }

    // TODO: Send to Axiom or other logging service
    // Example:
    // if (process.env.AXIOM_DATASET) {
    //   await sendToAxiom(logEntry)
    // }
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

