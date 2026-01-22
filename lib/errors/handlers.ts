/**
 * API Error Handlers
 * 
 * Utilities for handling errors in API routes and converting them
 * to structured JSON responses.
 */

import { NextResponse } from 'next/server'
import {
  AppError,
  RateLimitError,
  ProviderError,
  getErrorMetadata,
} from './types'


/**
 * Handle errors in API routes and return structured JSON responses
 * 
 * @param error - The error to handle
 * @param defaultMessage - Default message if error doesn't have one
 * @returns NextResponse with error JSON
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): NextResponse {
  // Convert to AppError if needed
  let appError: AppError

  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Error) {
    // Convert generic Error to ProviderError
    appError = new ProviderError(error.message, 'unknown', {
      cause: error,
    })
  } else {
    // Unknown error type
    appError = new ProviderError(String(error) || defaultMessage, 'unknown')
  }

  // Get error JSON
  const errorJson = appError.toJSON()

  // Return appropriate response
  return NextResponse.json(
    {
      success: false,
      error: errorJson,
    },
    {
      status: appError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...(appError instanceof RateLimitError && appError.reset && {
          'Retry-After': String(Math.ceil((appError.reset - Date.now()) / 1000)),
          'X-RateLimit-Reset': String(Math.ceil(appError.reset / 1000)),
          ...(appError.remaining !== undefined && {
            'X-RateLimit-Remaining': String(appError.remaining),
          }),
        }),
      },
    }
  )
}

/**
 * Create a standardized error response
 * 
 * @param code - Error code
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 * @returns NextResponse with error JSON
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        statusCode,
        ...(details && { details }),
      },
    },
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Create error event for streaming responses
 * 
 * @param error - The error to serialize
 * @returns Formatted error event string for SSE
 */
export function createStreamErrorEvent(error: unknown): string {
  const metadata = getErrorMetadata(error)
  
  const errorData = {
    type: 'error',
    code: metadata.code || 'UNKNOWN_ERROR',
    message: metadata.message,
    statusCode: metadata.statusCode || 500,
    ...(metadata.requestId && { requestId: metadata.requestId }),
    ...(metadata.agent && { agent: metadata.agent }),
    ...(metadata.provider && { provider: metadata.provider }),
    ...(metadata.retryable !== undefined && { retryable: metadata.retryable }),
  }

  return `event: error\ndata: ${JSON.stringify(errorData)}\n\n`
}

