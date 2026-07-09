import { describe, expect, it } from 'vitest'
import { classifyProviderError, serializeStreamError } from '@/lib/errors/provider-errors'

describe('classifyProviderError', () => {
  it('classifies gateway credit-balance errors as non-retryable and hides raw text', () => {
    const raw = new Error(
      'A positive credit balance is required for all requests, including BYOK, so fallback providers remain available. Add credits at https://vercel.com/[team]/~/ai?modal=top-up'
    )
    const classified = classifyProviderError(raw)

    expect(classified.code).toBe('provider_credits_exhausted')
    expect(classified.retryable).toBe(false)
    expect(classified.message).not.toContain('vercel.com')
    expect(classified.message).not.toContain('credit balance')
  })

  it('classifies 402 status codes as credit exhaustion', () => {
    const classified = classifyProviderError({ statusCode: 402, message: 'Payment Required' })
    expect(classified.code).toBe('provider_credits_exhausted')
    expect(classified.retryable).toBe(false)
  })

  it('classifies rate limit errors as retryable', () => {
    const classified = classifyProviderError(new Error('Rate limit exceeded, too many requests'))
    expect(classified.code).toBe('provider_rate_limited')
    expect(classified.retryable).toBe(true)
  })

  it('classifies invalid API key errors as non-retryable auth errors', () => {
    const classified = classifyProviderError(new Error('Invalid API key provided'))
    expect(classified.code).toBe('provider_auth_error')
    expect(classified.retryable).toBe(false)
  })

  it('classifies timeouts as retryable', () => {
    const classified = classifyProviderError(new Error('on_page_instant_pages timed out after 60000ms'))
    expect(classified.code).toBe('tool_timeout')
    expect(classified.retryable).toBe(true)
  })

  it('classifies network failures as retryable', () => {
    const classified = classifyProviderError(new Error('fetch failed: ECONNRESET'))
    expect(classified.code).toBe('network_error')
    expect(classified.retryable).toBe(true)
  })

  it('falls back to a generic retryable stream error', () => {
    const classified = classifyProviderError(new Error('something unexpected'))
    expect(classified.code).toBe('stream_error')
    expect(classified.retryable).toBe(true)
  })

  it('reads nested cause errors', () => {
    const cause = new Error('credit balance is required')
    const wrapped = new Error('Gateway request failed', { cause })
    expect(classifyProviderError(wrapped).code).toBe('provider_credits_exhausted')
  })

  it('handles non-Error inputs safely', () => {
    expect(classifyProviderError(undefined).code).toBe('stream_error')
    expect(classifyProviderError('rate limit hit').code).toBe('provider_rate_limited')
    expect(classifyProviderError({ error: 'quota exceeded' }).code).toBe('provider_credits_exhausted')
  })
})

describe('serializeStreamError', () => {
  it('produces machine-readable JSON with code, message, and retryability', () => {
    const serialized = serializeStreamError(new Error('A positive credit balance is required'))
    const parsed = JSON.parse(serialized) as { code: string; message: string; retryable: boolean }

    expect(parsed.code).toBe('provider_credits_exhausted')
    expect(parsed.retryable).toBe(false)
    expect(typeof parsed.message).toBe('string')
    expect(parsed.message.length).toBeGreaterThan(0)
  })
})
