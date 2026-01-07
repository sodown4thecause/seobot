/**
 * Custom Error Types
 * 
 * Defines standardized error classes for consistent error handling
 * across agents and API routes.
 */

/**
 * Base error class with metadata support
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly requestId?: string
  public readonly agent?: string
  public readonly provider?: string

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    options?: {
      details?: Record<string, unknown>
      requestId?: string
      agent?: string
      provider?: string
      cause?: Error
    }
  ) {
    super(message, { cause: options?.cause })
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = options?.details
    this.requestId = options?.requestId
    this.agent = options?.agent
    this.provider = options?.provider

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): {
    code: string
    message: string
    statusCode: number
    details?: Record<string, unknown>
    requestId?: string
    agent?: string
    provider?: string
  } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
      ...(this.requestId && { requestId: this.requestId }),
      ...(this.agent && { agent: this.agent }),
      ...(this.provider && { provider: this.provider }),
    }
  }
}

/**
 * Rate limit exceeded error
 * Thrown when API rate limits are exceeded
 */
export class RateLimitError extends AppError {
  public readonly reset?: number
  public readonly remaining?: number

  constructor(
    message: string = 'Rate limit exceeded',
    options?: {
      reset?: number
      remaining?: number
      requestId?: string
      agent?: string
      provider?: string
    }
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, {
      requestId: options?.requestId,
      agent: options?.agent,
      provider: options?.provider,
      details: {
        reset: options?.reset,
        remaining: options?.remaining,
      },
    })
    this.reset = options?.reset
    this.remaining = options?.remaining
  }
}

/**
 * Provider API error
 * Thrown when external provider APIs fail (OpenAI, Perplexity, DataForSEO, etc.)
 */
export class ProviderError extends AppError {
  public readonly providerCode?: string
  public readonly retryable: boolean

  constructor(
    message: string,
    provider: string,
    options?: {
      statusCode?: number
      providerCode?: string
      retryable?: boolean
      requestId?: string
      agent?: string
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    const statusCode = options?.statusCode || 502
    const retryable = options?.retryable ?? (statusCode >= 500 || statusCode === 429)

    super(
      message,
      `PROVIDER_ERROR_${provider.toUpperCase()}`,
      statusCode,
      {
        requestId: options?.requestId,
        agent: options?.agent,
        provider,
        details: {
          ...options?.details,
          providerCode: options?.providerCode,
          retryable,
        },
        cause: options?.cause,
      }
    )
    this.providerCode = options?.providerCode
    this.retryable = retryable
  }
}

/**
 * Validation error
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>

  constructor(
    message: string,
    options?: {
      fields?: Record<string, string[]>
      requestId?: string
      details?: Record<string, unknown>
    }
  ) {
    super(message, 'VALIDATION_ERROR', 400, {
      requestId: options?.requestId,
      details: {
        ...options?.details,
        fields: options?.fields,
      },
    })
    this.fields = options?.fields
  }
}

/**
 * Authentication/Authorization error
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    options?: {
      requestId?: string
      details?: Record<string, unknown>
    }
  ) {
    super(message, 'AUTHENTICATION_ERROR', 401, options)
  }
}

/**
 * Authorization error (insufficient permissions)
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    options?: {
      requestId?: string
      details?: Record<string, unknown>
    }
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, options)
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    options?: {
      requestId?: string
      resource?: string
      details?: Record<string, unknown>
    }
  ) {
    super(message, 'NOT_FOUND', 404, {
      ...options,
      details: {
        ...options?.details,
        resource: options?.resource,
      },
    })
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return false
  }

  if (error instanceof ProviderError) {
    return error.retryable
  }

  if (error instanceof RateLimitError) {
    return true // Rate limits are retryable after reset
  }

  if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return false // Client errors are not retryable
  }

  if (error instanceof AppError) {
    // Retry server errors (5xx) but not client errors (4xx)
    return error.statusCode >= 500
  }

  // For unknown errors, check if they have status codes
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode
    return statusCode >= 500 || statusCode === 429
  }

  // Default to retrying unknown errors (might be transient)
  return true
}

/**
 * Extract error details for logging
 */
export function getErrorMetadata(error: unknown): {
  name: string
  message: string
  code?: string
  statusCode?: number
  agent?: string
  provider?: string
  requestId?: string
  retryable?: boolean
  stack?: string
} {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      agent: error.agent,
      provider: error.provider,
      requestId: error.requestId,
      retryable: isRetryable(error),
      stack: error.stack,
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

