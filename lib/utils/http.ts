import { z } from 'zod';

/**
 * HTTP utility for making resilient API calls with retry logic,
 * timeouts, request tracking, and error handling
 */

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number; // milliseconds
  retries?: number;
  retryDelay?: number; // milliseconds
  retryOn?: number[]; // HTTP status codes to retry on
  validateResponse?: z.ZodSchema;
  signal?: AbortSignal;
}

export interface HttpResponse<T = unknown> {
  success: true;
  data: T;
  status: number;
  headers: Headers;
  requestId: string;
  duration: number;
}

export interface HttpError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    details?: unknown;
  };
  duration: number;
}

export type HttpResult<T = unknown> = HttpResponse<T> | HttpError;

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000);
}

/**
 * Check if status code should trigger a retry
 */
function shouldRetry(status: number, retryOn: number[]): boolean {
  return retryOn.includes(status) || status === 429 || (status >= 500 && status < 600);
}

/**
 * Make an HTTP request with resilience features
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResult<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504],
    validateResponse,
    signal,
  } = options;

  const requestId = generateRequestId();
  const startTime = Date.now();

  // Add request ID to headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...headers,
  };

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge signals if external signal provided
      const combinedSignal = signal
        ? AbortSignal.any?.([signal, controller.signal]) || controller.signal
        : controller.signal;

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: combinedSignal,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      // Check if we should retry based on status
      if (!response.ok && attempt < retries && shouldRetry(response.status, retryOn)) {
        const backoffDelay = getBackoffDelay(attempt, retryDelay);
        
        console.warn(`Request ${requestId} failed with status ${response.status}, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${retries})`);
        
        await sleep(backoffDelay);
        attempt++;
        continue;
      }

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails: unknown = undefined;

        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorBody.message || errorMessage;
          errorDetails = errorBody;
        } catch {
          // Response body is not JSON or empty
        }

        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorMessage,
            statusCode: response.status,
            requestId,
            details: errorDetails,
          },
          duration,
        };
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as T;
      }

      // Validate response if schema provided
      if (validateResponse) {
        try {
          data = validateResponse.parse(data);
        } catch (error) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Response validation failed',
              statusCode: 500,
              requestId,
              details: error instanceof z.ZodError ? error.errors : error,
            },
            duration,
          };
        }
      }

      return {
        success: true,
        data,
        status: response.status,
        headers: response.headers,
        requestId,
        duration,
      };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort/timeout if it's the final attempt
      if (attempt >= retries) {
        break;
      }

      // Check if error is retryable
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const isAbortError = error instanceof Error && error.name === 'AbortError';

      if (isNetworkError || (isAbortError && attempt < retries)) {
        const backoffDelay = getBackoffDelay(attempt, retryDelay);
        
        console.warn(`Request ${requestId} failed with error: ${lastError.message}, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${retries})`);
        
        await sleep(backoffDelay);
        attempt++;
        continue;
      }

      break;
    }
  }

  // All retries exhausted
  const duration = Date.now() - startTime;
  const errorMessage = lastError?.message || 'Request failed after all retries';

  return {
    success: false,
    error: {
      code: lastError?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: errorMessage,
      statusCode: lastError?.name === 'AbortError' ? 408 : 0,
      requestId,
      details: lastError,
    },
    duration,
  };
}

/**
 * Convenience methods for common HTTP verbs
 */
export const http = {
  get: <T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
    httpRequest<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method'>) =>
    httpRequest<T>(url, { ...options, method: 'POST', body }),

  put: <T = unknown>(url: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method'>) =>
    httpRequest<T>(url, { ...options, method: 'PUT', body }),

  delete: <T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
    httpRequest<T>(url, { ...options, method: 'DELETE' }),

  patch: <T = unknown>(url: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method'>) =>
    httpRequest<T>(url, { ...options, method: 'PATCH', body }),
};

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5, // failures before opening
    private timeout: number = 60000, // milliseconds to wait before half-open
    private successThreshold: number = 2 // successes needed to close from half-open
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.state = 'closed';
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number, // max tokens
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000 // milliseconds
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time
    const tokensNeeded = tokens - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * this.refillInterval;

    await sleep(waitTime);
    this.refill();
    this.tokens -= tokens;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  available(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}
