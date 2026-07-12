export type ProviderErrorCode =
  | 'provider_credits_exhausted'
  | 'provider_rate_limited'
  | 'provider_auth_error'
  | 'model_unavailable'
  | 'tool_timeout'
  | 'network_error'
  | 'stream_error'

export interface ClassifiedProviderError {
  code: ProviderErrorCode
  message: string
  retryable: boolean
}

function errorText(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const cause = error.cause
    return [error.message, cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : ''].join(' ')
  }
  if (error && typeof error === 'object') {
    const value = error as { message?: unknown; error?: unknown }
    return [value.message, value.error].filter((part): part is string => typeof part === 'string').join(' ')
  }
  return ''
}

function statusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = error as { status?: unknown; statusCode?: unknown; cause?: unknown }
  if (typeof value.statusCode === 'number') return value.statusCode
  if (typeof value.status === 'number') return value.status
  return statusCode(value.cause)
}

export function classifyProviderError(error: unknown): ClassifiedProviderError {
  const text = errorText(error).toLowerCase()
  const status = statusCode(error)

  if (status === 402 || /credit balance|insufficient credits|payment required|billing|quota exceeded/.test(text)) {
    return {
      code: 'provider_credits_exhausted',
      message: "We're experiencing high demand and this request couldn't be completed right now. Please try again later.",
      retryable: false,
    }
  }
  if (status === 429 || /rate limit|too many requests/.test(text)) {
    return {
      code: 'provider_rate_limited',
      message: 'The AI service is receiving a lot of requests right now. Please wait a moment and try again.',
      retryable: true,
    }
  }
  if (status === 401 || status === 403 || /unauthorized|invalid api key|forbidden/.test(text)) {
    return {
      code: 'provider_auth_error',
      message: "Something is misconfigured on our side and we couldn't reach the AI service.",
      retryable: false,
    }
  }
  if (status === 404 || /model not found|unsupported model|no such model|model_not_found/.test(text)) {
    return {
      code: 'model_unavailable',
      message: 'The AI model for this request is temporarily unavailable. Please try again shortly.',
      retryable: true,
    }
  }
  if (/timed out|timeout/.test(text)) {
    return {
      code: 'tool_timeout',
      message: 'Part of this request took too long and was stopped. Please try again.',
      retryable: true,
    }
  }
  if (/fetch failed|econnrefused|econnreset|socket hang up|network/.test(text)) {
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

export function serializeStreamError(error: unknown): string {
  const { code, message, retryable } = classifyProviderError(error)
  return JSON.stringify({ code, message, retryable })
}
