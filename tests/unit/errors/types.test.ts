import { describe, expect, it } from 'vitest'
import {
  AppError,
  AbortError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ProviderError,
  RateLimitError,
  ValidationError,
  getErrorMetadata,
  isAbortError,
  isRetryable,
} from '@/lib/errors/types'

describe('AppError', () => {
  it('creates with required fields', () => {
    const err = new AppError('Something went wrong', 'MY_CODE', 500)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Something went wrong')
    expect(err.code).toBe('MY_CODE')
    expect(err.statusCode).toBe(500)
    expect(err.name).toBe('AppError')
  })

  it('defaults statusCode to 500', () => {
    const err = new AppError('oops', 'CODE')
    expect(err.statusCode).toBe(500)
  })

  it('stores optional fields', () => {
    const err = new AppError('msg', 'CODE', 400, {
      details: { field: 'value' },
      requestId: 'req-1',
      agent: 'my-agent',
      provider: 'openai',
    })
    expect(err.details).toEqual({ field: 'value' })
    expect(err.requestId).toBe('req-1')
    expect(err.agent).toBe('my-agent')
    expect(err.provider).toBe('openai')
  })

  it('serialises via toJSON()', () => {
    const err = new AppError('msg', 'CODE', 422, {
      details: { key: 1 },
      requestId: 'r',
      agent: 'a',
      provider: 'p',
    })
    const json = err.toJSON()
    expect(json).toMatchObject({
      code: 'CODE',
      message: 'msg',
      statusCode: 422,
      details: { key: 1 },
      requestId: 'r',
      agent: 'a',
      provider: 'p',
    })
  })

  it('omits undefined optional keys from toJSON()', () => {
    const err = new AppError('msg', 'CODE', 500)
    const json = err.toJSON()
    expect(json).not.toHaveProperty('details')
    expect(json).not.toHaveProperty('requestId')
    expect(json).not.toHaveProperty('agent')
    expect(json).not.toHaveProperty('provider')
  })

  it('has a stack trace', () => {
    const err = new AppError('msg', 'CODE')
    expect(err.stack).toBeTruthy()
  })

  it('stores cause error', () => {
    const cause = new Error('root cause')
    const err = new AppError('msg', 'CODE', 500, { cause })
    expect(err.cause).toBe(cause)
  })
})

describe('RateLimitError', () => {
  it('has status 429 and RATE_LIMIT_EXCEEDED code', () => {
    const err = new RateLimitError()
    expect(err.statusCode).toBe(429)
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('uses default message when none provided', () => {
    expect(new RateLimitError().message).toBe('Rate limit exceeded')
  })

  it('stores reset and remaining', () => {
    const err = new RateLimitError('Too many', { reset: 1234567890, remaining: 0 })
    expect(err.reset).toBe(1234567890)
    expect(err.remaining).toBe(0)
  })
})

describe('ProviderError', () => {
  it('generates provider-specific code', () => {
    const err = new ProviderError('API down', 'openai')
    expect(err.code).toBe('PROVIDER_ERROR_OPENAI')
  })

  it('defaults statusCode to 502', () => {
    const err = new ProviderError('fail', 'anthropic')
    expect(err.statusCode).toBe(502)
  })

  it('retryable is true for 5xx by default', () => {
    const err = new ProviderError('fail', 'openai', { statusCode: 503 })
    expect(err.retryable).toBe(true)
  })

  it('retryable is true for 429', () => {
    const err = new ProviderError('rate limited', 'openai', { statusCode: 429 })
    expect(err.retryable).toBe(true)
  })

  it('retryable is false for 4xx (non-429)', () => {
    const err = new ProviderError('bad request', 'openai', { statusCode: 400 })
    expect(err.retryable).toBe(false)
  })

  it('respects explicit retryable override', () => {
    const err = new ProviderError('fail', 'openai', { statusCode: 500, retryable: false })
    expect(err.retryable).toBe(false)
  })

  it('stores providerCode', () => {
    const err = new ProviderError('fail', 'openai', { providerCode: 'model_not_found' })
    expect(err.providerCode).toBe('model_not_found')
  })
})

describe('ValidationError', () => {
  it('has status 400 and VALIDATION_ERROR code', () => {
    const err = new ValidationError('Invalid input')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
  })

  it('stores field errors', () => {
    const err = new ValidationError('Bad', { fields: { email: ['required'] } })
    expect(err.fields).toEqual({ email: ['required'] })
  })
})

describe('AuthenticationError', () => {
  it('has status 401 and AUTHENTICATION_ERROR code', () => {
    const err = new AuthenticationError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('AUTHENTICATION_ERROR')
  })

  it('uses default message', () => {
    expect(new AuthenticationError().message).toBe('Authentication required')
  })

  it('accepts custom message', () => {
    expect(new AuthenticationError('Token expired').message).toBe('Token expired')
  })
})

describe('AuthorizationError', () => {
  it('has status 403 and AUTHORIZATION_ERROR code', () => {
    const err = new AuthorizationError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('AUTHORIZATION_ERROR')
  })

  it('uses default message', () => {
    expect(new AuthorizationError().message).toBe('Insufficient permissions')
  })
})

describe('NotFoundError', () => {
  it('has status 404 and NOT_FOUND code', () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })

  it('uses default message', () => {
    expect(new NotFoundError().message).toBe('Resource not found')
  })
})

describe('AbortError', () => {
  it('has status 499 and ABORTED code', () => {
    const err = new AbortError()
    expect(err.statusCode).toBe(499)
    expect(err.code).toBe('ABORTED')
  })

  it('uses default message', () => {
    expect(new AbortError().message).toBe('Operation was aborted')
  })
})

describe('isAbortError', () => {
  it('returns true for AbortError', () => {
    expect(isAbortError(new AbortError())).toBe(true)
  })

  it('returns true for DOM AbortError by name', () => {
    const domErr = Object.assign(new Error('Aborted'), { name: 'AbortError' })
    expect(isAbortError(domErr)).toBe(true)
  })

  it('returns false for other AppError subclasses', () => {
    expect(isAbortError(new ValidationError('bad'))).toBe(false)
    expect(isAbortError(new ProviderError('fail', 'openai'))).toBe(false)
  })

  it('returns false for plain Error', () => {
    expect(isAbortError(new Error('oops'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isAbortError(null)).toBe(false)
    expect(isAbortError('abort')).toBe(false)
    expect(isAbortError(42)).toBe(false)
  })
})

describe('isRetryable', () => {
  it('returns false for AbortError', () => {
    expect(isRetryable(new AbortError())).toBe(false)
  })

  it('returns false for DOM AbortError', () => {
    const e = Object.assign(new Error(), { name: 'AbortError' })
    expect(isRetryable(e)).toBe(false)
  })

  it('returns true for RateLimitError', () => {
    expect(isRetryable(new RateLimitError())).toBe(true)
  })

  it('returns the ProviderError.retryable value', () => {
    const retryable = new ProviderError('fail', 'openai', { statusCode: 500 })
    const notRetryable = new ProviderError('bad', 'openai', { statusCode: 400 })
    expect(isRetryable(retryable)).toBe(true)
    expect(isRetryable(notRetryable)).toBe(false)
  })

  it('returns false for ValidationError', () => {
    expect(isRetryable(new ValidationError('bad'))).toBe(false)
  })

  it('returns false for AuthenticationError', () => {
    expect(isRetryable(new AuthenticationError())).toBe(false)
  })

  it('returns false for AuthorizationError', () => {
    expect(isRetryable(new AuthorizationError())).toBe(false)
  })

  it('returns true for AppError with 5xx status', () => {
    expect(isRetryable(new AppError('fail', 'CODE', 503))).toBe(true)
  })

  it('returns false for AppError with 4xx status', () => {
    expect(isRetryable(new AppError('bad', 'CODE', 422))).toBe(false)
  })

  it('returns true for plain object with statusCode >= 500', () => {
    expect(isRetryable({ statusCode: 503 })).toBe(true)
  })

  it('returns true for plain object with statusCode 429', () => {
    expect(isRetryable({ statusCode: 429 })).toBe(true)
  })

  it('returns false for plain object with statusCode 400', () => {
    expect(isRetryable({ statusCode: 400 })).toBe(false)
  })

  it('returns false for unknown errors', () => {
    expect(isRetryable(new Error('oops'))).toBe(false)
    expect(isRetryable('string error')).toBe(false)
    expect(isRetryable(null)).toBe(false)
  })
})

describe('getErrorMetadata', () => {
  it('extracts metadata from AppError', () => {
    const err = new AppError('msg', 'CODE', 503, {
      agent: 'my-agent',
      provider: 'openai',
      requestId: 'req-1',
    })
    const meta = getErrorMetadata(err)
    expect(meta.name).toBe('AppError')
    expect(meta.message).toBe('msg')
    expect(meta.code).toBe('CODE')
    expect(meta.statusCode).toBe(503)
    expect(meta.agent).toBe('my-agent')
    expect(meta.provider).toBe('openai')
    expect(meta.requestId).toBe('req-1')
    expect(typeof meta.retryable).toBe('boolean')
    expect(meta.stack).toBeTruthy()
  })

  it('extracts metadata from plain Error', () => {
    const err = new Error('plain error')
    const meta = getErrorMetadata(err)
    expect(meta.name).toBe('Error')
    expect(meta.message).toBe('plain error')
    expect(meta.code).toBeUndefined()
    expect(meta.statusCode).toBeUndefined()
    expect(meta.stack).toBeTruthy()
  })

  it('handles non-error values', () => {
    const meta = getErrorMetadata('something went wrong')
    expect(meta.name).toBe('UnknownError')
    expect(meta.message).toBe('something went wrong')
  })

  it('handles null', () => {
    const meta = getErrorMetadata(null)
    expect(meta.name).toBe('UnknownError')
    expect(meta.message).toBe('null')
  })

  it('marks AbortError as non-retryable', () => {
    const meta = getErrorMetadata(new AbortError())
    expect(meta.retryable).toBe(false)
  })

  it('marks ProviderError 503 as retryable', () => {
    const meta = getErrorMetadata(new ProviderError('fail', 'openai', { statusCode: 503 }))
    expect(meta.retryable).toBe(true)
  })
})
