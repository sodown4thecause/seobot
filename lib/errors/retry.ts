/**
 * Agent Retry Utility
 * 
 * Provides retry logic specifically designed for agent functions
 * with exponential backoff and metadata tracking.
 */

import { AppError, ProviderError, isRetryable, getErrorMetadata } from './types'
import { nanoid } from 'nanoid'

export interface AgentRetryOptions {
  retries?: number
  backoff?: {
    initial?: number // Initial delay in ms
    factor?: number // Exponential factor
    max?: number // Maximum delay in ms
  }
  agent?: string
  provider?: string
  onRetry?: (error: Error, attempt: number, delay: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<AgentRetryOptions, 'onRetry' | 'agent' | 'provider'>> = {
  retries: 2,
  backoff: {
    initial: 200,
    factor: 2,
    max: 10000,
  },
}

/**
 * Delay execution by specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wrap an agent function with retry logic and exponential backoff
 * 
 * @param fn - Agent function to execute
 * @param options - Retry configuration
 * @returns Promise with the result of the function
 * 
 * @example
 * ```typescript
 * const result = await withAgentRetry(
 *   () => researchAgent.execute(query),
 *   { retries: 3, agent: 'research-agent', provider: 'openai' }
 * );
 * ```
 */
export async function withAgentRetry<T>(
  fn: () => Promise<T>,
  options: AgentRetryOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_OPTIONS.retries,
    backoff = DEFAULT_OPTIONS.backoff,
    agent,
    provider,
    onRetry,
  } = options

  const initialDelay = backoff.initial ?? DEFAULT_OPTIONS.backoff.initial
  const factor = backoff.factor ?? DEFAULT_OPTIONS.backoff.factor
  const maxDelay = backoff.max ?? DEFAULT_OPTIONS.backoff.max

  const requestId = nanoid()

  let lastError: Error | unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      // Check if error is retryable
      if (!isRetryable(error)) {
        // For non-retryable errors, wrap in ProviderError if we have metadata
        if (error instanceof Error && !(error instanceof AppError)) {
          throw new ProviderError(
            error.message,
            provider || 'unknown',
            { requestId, agent, retryable: false, cause: error }
          )
        }
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        // Convert unknown errors to ProviderError if we have provider info
        if (error instanceof Error && !(error instanceof AppError)) {
          throw new ProviderError(
            error.message,
            provider || 'unknown',
            { requestId, agent, retryable: false, cause: error }
          )
        }
        throw error
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(initialDelay! * Math.pow(factor!, attempt), maxDelay!)

      // Log retry attempt
      const errorMetadata = getErrorMetadata(error)
      console.warn(
        `[AgentRetry] Attempt ${attempt + 1}/${retries + 1} failed for ${agent || 'agent'}`,
        {
          requestId,
          agent,
          provider,
          error: errorMetadata.message,
          code: errorMetadata.code,
          retryable: errorMetadata.retryable,
          delayMs,
        }
      )

      // Call onRetry callback if provided
      if (onRetry && error instanceof Error) {
        onRetry(error, attempt + 1, delayMs)
      }

      // Wait before retrying
      await delay(delayMs)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

