/**
 * Provider Error Classification
 *
 * Maps raw AI provider / gateway / tool errors to safe, user-friendly
 * messages. Raw provider text (billing details, internal URLs, stack traces)
 * must never reach the client — always classify through here first.
 */

export interface ClassifiedProviderError {
  /** Stable machine-readable code — used by the client to pick UI treatment. */
  code:
    | 'provider_credits_exhausted'
    | 'provider_rate_limited'
    | 'provider_auth_error'
    | 'model_unavailable'
    | 'tool_timeout'
    | 'network_error'
    | 'stream_error'
  /** Safe message for end users. Never contains raw provider text. */
  message: string
  /** Whether an immediate retry could plausibly succeed. */
  retryable: boolean
}

function extractErrorText(error: unknown): string {
  if (error == null) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const parts = [error.message]
    if (error.cause instanceof Error) parts.push(error.cause.message)
    else if (typeof error.cause === 'string') parts.push(error.cause)
    return parts.join(' | ')
  }
  if (typeof error === 'object') {
    const maybe = error as { message?: unknown; error?: unknown; statusCode?: unknown }
    const nested = [maybe.message, maybe.error]
      .filter((v): v is string => typeof v === 'string')
      .join(' | ')
    if (nested) return nested
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const maybe = error as { statusCode?: unknown; status?: unknown; cause?: unknown }
    if (typeof maybe.statusCode === 'number') return maybe.statusCode
    if (typeof maybe.status === 'number') return maybe.status
    if (maybe.cause && typeof maybe.cause === 'object') {
      return extractStatusCode(maybe.cause)
    }
  }
  return undefined
}

/**
 * Classify any error thrown by a model call or tool execution into a safe,
 * user-facing shape.
 */
export function classifyProviderError(error: unknown): ClassifiedProviderError {
  const text = extractErrorText(error).toLowerCase()
  const status = extractStatusCode(error)

  if (
    status === 402 ||
    text.includes('credit balance') ||
    text.includes('positive credit') ||
    text.includes('insufficient credits') ||
    text.includes('payment required') ||
    text.includes('billing') ||
    text.includes('quota exceeded')
  ) {
    return {
      code: 'provider_credits_exhausted',
      message:
        "We're experiencing high demand and this request couldn't be completed right now. Our team has been notified — please try again in a little while.",
      retryable: false,
    }
  }

  if (status === 429 || text.includes('rate limit') || text.includes('too many requests')) {
    return {
      code: 'provider_rate_limited',
      message: 'The AI service is receiving a lot of requests right now. Please wait a moment and try again.',
      retryable: true,
    }
  }

  if (
    status === 401 ||
    status === 403 ||
    text.includes('unauthorized') ||
    text.includes('invalid api key') ||
    text.includes('api key') ||
    text.includes('forbidden')
  ) {
    return {
      code: 'provider_auth_error',
      message: "Something is misconfigured on our side and we couldn't reach the AI service. Our team has been notified.",
      retryable: false,
    }
  }

  if (
    status === 404 ||
    text.includes('model not found') ||
    text.includes('unsupported model') ||
    text.includes('no such model') ||
    text.includes('model_not_found')
  ) {
    return {
      code: 'model_unavailable',
      message: 'The AI model for this request is temporarily unavailable. Please try again shortly.',
      retryable: true,
    }
  }

  if (text.includes('timed out') || text.includes('timeout')) {
    return {
      code: 'tool_timeout',
      message: 'Part of this request took too long and was stopped. Please try again — it usually works on a second attempt.',
      retryable: true,
    }
  }

  if (
    text.includes('fetch failed') ||
    text.includes('econnrefused') ||
    text.includes('econnreset') ||
    text.includes('socket hang up') ||
    text.includes('network')
  ) {
    return {
      code: 'network_error',
      message: 'We had trouble reaching one of our data providers. Please try again in a moment.',
      retryable: true,
    }
  }

  return {
    code: 'stream_error',
    message: 'Something went wrong while generating this response. Please try again.',
    retryable: true,
  }
}

/**
 * Serialize a classified error for the UI message stream. The client's
 * error parser JSON-parses error text, so this keeps code + retryability
 * machine-readable without leaking raw provider details.
 */
export function serializeStreamError(error: unknown): string {
  const classified = classifyProviderError(error)
  return JSON.stringify({
    code: classified.code,
    message: classified.message,
    retryable: classified.retryable,
  })
}
