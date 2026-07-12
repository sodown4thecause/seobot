import { describe, expect, it } from 'vitest'
import { classifyProviderError, serializeStreamError } from '@/lib/errors/provider-errors'

describe('provider error classification', () => {
  it('classifies rate limits as safe and retryable', () => {
    const classified = classifyProviderError({ statusCode: 429, message: 'Rate limit at https://provider.invalid' })

    expect(classified).toMatchObject({ code: 'provider_rate_limited', retryable: true })
    expect(classified.message).not.toContain('provider.invalid')
  })

  it('classifies credit and auth failures as non-retryable without leaking details', () => {
    const credit = classifyProviderError(new Error('positive credit balance required at https://vercel.com/top-up'))
    const auth = classifyProviderError(new Error('Invalid API key: secret-value'))

    expect(credit).toMatchObject({ code: 'provider_credits_exhausted', retryable: false })
    expect(auth).toMatchObject({ code: 'provider_auth_error', retryable: false })
    expect(credit.message).not.toContain('vercel.com')
    expect(auth.message).not.toContain('secret-value')
  })

  it('serializes only the stable client error contract', () => {
    expect(JSON.parse(serializeStreamError(new Error('fetch failed: ECONNRESET')))).toEqual({
      code: 'network_error',
      message: 'We had trouble reaching one of our data providers. Please try again in a moment.',
      retryable: true,
    })
  })
})
