/**
 * Retry Utility
 * 
 * Provides retry logic with exponential backoff for transient API failures.
 * Uses p-retry for robust retry handling.
 */

import pRetry, { AbortError } from 'p-retry';

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
};

/**
 * Execute a function with automatic retry on failure
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Promise with the result of the function
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchFromAPI('/endpoint'),
 *   { retries: 3, factor: 2 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries, factor, minTimeout, maxTimeout } = { ...DEFAULT_OPTIONS, ...options };
  
  return pRetry(fn, {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    onFailedAttempt: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        `[Retry] Attempt ${error.attemptNumber} failed. ` +
        `${error.retriesLeft} retries left. Error: ${errorMessage}`
      );
      if (options.onRetry && error instanceof Error) {
        options.onRetry(error, error.attemptNumber);
      }
    },
  });
}

/**
 * Create an AbortError to stop retrying immediately
 * Use this for non-retryable errors (e.g., 401, 403)
 */
export function createAbortError(message: string): AbortError {
  return new AbortError(message);
}

/**
 * Check if an error should be retried
 * Returns false for client errors (4xx except 429), true for server errors (5xx)
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Check HTTP status codes
  const status = error.status || error.statusCode || error.response?.status;
  if (status) {
    // Don't retry client errors (except rate limiting)
    if (status >= 400 && status < 500 && status !== 429) {
      return false;
    }
    // Retry server errors and rate limiting
    if (status >= 500 || status === 429) {
      return true;
    }
  }
  
  // Default to retrying unknown errors
  return true;
}

/**
 * Execute with retry, but abort on non-retryable errors
 */
export async function withSmartRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(async () => {
    try {
      return await fn();
    } catch (error: any) {
      if (!isRetryableError(error)) {
        throw new AbortError(error.message || 'Non-retryable error');
      }
      throw error;
    }
  }, options);
}

/**
 * Retry with circuit breaker pattern
 * After maxFailures consecutive failures, opens circuit for resetTimeout ms
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure: number = 0;
  private isOpen = false;

  constructor(
    private readonly maxFailures: number = 5,
    private readonly resetTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.isOpen && Date.now() - this.lastFailure > this.resetTimeout) {
      this.isOpen = false;
      this.failures = 0;
      console.log('[CircuitBreaker] Circuit reset - attempting recovery');
    }

    // If circuit is open, fail fast
    if (this.isOpen) {
      throw new Error('Circuit breaker is open - service unavailable');
    }

    try {
      const result = await fn();
      // Success - reset failure count
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      
      if (this.failures >= this.maxFailures) {
        this.isOpen = true;
        console.error(`[CircuitBreaker] Circuit opened after ${this.failures} failures`);
      }
      
      throw error;
    }
  }

  get status(): 'closed' | 'open' | 'half-open' {
    if (!this.isOpen) return 'closed';
    if (Date.now() - this.lastFailure > this.resetTimeout) return 'half-open';
    return 'open';
  }
}
