/**
 * Abort Signal Utilities
 * 
 * Provides consistent abort signal handling across all agents.
 * Ensures proper cleanup and standardized error throwing.
 */

import { AbortError, isAbortError } from '@/lib/errors/types'

/**
 * Check if an abort signal has been triggered and throw if so.
 * Use at the beginning of long-running operations or between steps.
 * 
 * @param signal - Optional AbortSignal to check
 * @param context - Optional context string for better error messages
 * @throws AbortError if the signal has been aborted
 * 
 * @example
 * ```typescript
 * async function doWork(signal?: AbortSignal) {
 *   checkAborted(signal, 'before research')
 *   await doResearch()
 *   checkAborted(signal, 'before generation')
 *   await generateContent()
 * }
 * ```
 */
export function checkAborted(signal?: AbortSignal, context?: string): void {
  if (signal?.aborted) {
    const message = context 
      ? `Operation aborted: ${context}` 
      : 'Operation was aborted'
    throw new AbortError(message, {
      details: { context, abortReason: signal.reason }
    })
  }
}

/**
 * Options for the abortable wrapper
 */
export interface AbortableOptions<T> {
  /** The abort signal to monitor */
  signal?: AbortSignal
  /** Optional cleanup function to run on abort */
  cleanup?: () => void | Promise<void>
  /** Optional context for error messages */
  context?: string
  /** Optional fallback value to return on abort instead of throwing */
  fallback?: T
}

/**
 * Wrap an async operation with abort signal support.
 * Automatically handles cleanup and throws AbortError on abort.
 * 
 * @param operation - The async operation to run
 * @param options - Abort handling options
 * @returns The result of the operation
 * @throws AbortError if aborted (unless fallback is provided)
 * 
 * @example
 * ```typescript
 * const result = await withAbortSignal(
 *   async () => {
 *     const data = await fetchData()
 *     return processData(data)
 *   },
 *   {
 *     signal: abortSignal,
 *     cleanup: () => controller.abort(),
 *     context: 'fetching user data'
 *   }
 * )
 * ```
 */
export async function withAbortSignal<T>(
  operation: () => Promise<T>,
  options: AbortableOptions<T> = {}
): Promise<T> {
  const { signal, cleanup, context, fallback } = options

  // Check if already aborted before starting
  if (signal?.aborted) {
    await runCleanup(cleanup)
    if (fallback !== undefined) {
      return fallback
    }
    throw new AbortError(
      context ? `Operation aborted before start: ${context}` : 'Operation aborted before start',
      { details: { context, abortReason: signal.reason } }
    )
  }

  // If no signal, just run the operation
  if (!signal) {
    return operation()
  }

  // Create abort listener
  let aborted = false
  const onAbort = () => {
    aborted = true
  }
  signal.addEventListener('abort', onAbort, { once: true })

  try {
    const result = await operation()
    
    // Check if aborted during operation
    if (aborted || signal.aborted) {
      await runCleanup(cleanup)
      if (fallback !== undefined) {
        return fallback
      }
      throw new AbortError(
        context ? `Operation aborted: ${context}` : 'Operation was aborted',
        { details: { context, abortReason: signal.reason } }
      )
    }
    
    return result
  } catch (error) {
    // Always run cleanup on error
    await runCleanup(cleanup)
    
    // If it's already an abort error, re-throw
    if (isAbortError(error)) {
      throw error
    }
    
    // Check if abort happened
    if (aborted || signal.aborted) {
      if (fallback !== undefined) {
        return fallback
      }
      throw new AbortError(
        context ? `Operation aborted: ${context}` : 'Operation was aborted',
        { details: { context, abortReason: signal.reason, originalError: String(error) } }
      )
    }
    
    // Re-throw non-abort errors
    throw error
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}

/**
 * Create a linked AbortController that aborts when any of the provided signals abort.
 * Useful for combining multiple abort sources.
 * 
 * @param signals - Array of abort signals to link
 * @returns A new AbortController that will abort when any input signal aborts
 * 
 * @example
 * ```typescript
 * const controller = createLinkedAbortController([
 *   userCancelSignal,
 *   timeoutSignal,
 *   parentOperationSignal
 * ])
 * 
 * // Use controller.signal in your operations
 * await fetch(url, { signal: controller.signal })
 * 
 * // Don't forget to clean up
 * controller.abort() // or let it be handled by parent signals
 * ```
 */
export function createLinkedAbortController(
  signals: (AbortSignal | undefined)[]
): AbortController {
  const controller = new AbortController()
  
  const filteredSignals = signals.filter(
    (s): s is AbortSignal => s !== undefined
  )
  
  // If any signal is already aborted, abort immediately
  for (const signal of filteredSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller
    }
  }
  
  // Listen for future aborts
  for (const signal of filteredSignals) {
    signal.addEventListener(
      'abort',
      () => controller.abort(signal.reason),
      { once: true, signal: controller.signal }
    )
  }
  
  return controller
}

/**
 * Create an abort signal that triggers after a timeout.
 * 
 * @param ms - Timeout in milliseconds
 * @returns An object with the signal and a cleanup function
 * 
 * @example
 * ```typescript
 * const { signal, cleanup } = createTimeoutAbortSignal(30000)
 * try {
 *   await longOperation({ signal })
 * } finally {
 *   cleanup() // Clear the timeout
 * }
 * ```
 */
export function createTimeoutAbortSignal(ms: number): {
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new AbortError('Operation timed out', { details: { timeoutMs: ms } }))
  }, ms)
  
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  }
}

/**
 * Run cleanup function safely (catches errors)
 */
async function runCleanup(cleanup?: () => void | Promise<void>): Promise<void> {
  if (!cleanup) return
  
  try {
    await cleanup()
  } catch (error) {
    console.warn('[AbortHandler] Cleanup function threw an error:', error)
  }
}

/**
 * Type guard to check if a value is an AbortSignal
 */
export function isAbortSignal(value: unknown): value is AbortSignal {
  return (
    value !== null &&
    typeof value === 'object' &&
    'aborted' in value &&
    typeof (value as AbortSignal).aborted === 'boolean'
  )
}
