import { describe, expect, it } from 'vitest'
import { estimateCost, extractProviderFromModel } from '@/lib/analytics/cost-estimator'

describe('estimateCost — LLM providers', () => {
  it('estimates cost for a known OpenAI model', () => {
    // gpt-4o-mini: input $0.00015/1K, output $0.0006/1K
    const cost = estimateCost({
      provider: 'openai',
      model: 'openai/gpt-4o-mini',
      promptTokens: 1000,
      completionTokens: 500,
    })
    expect(cost).toBeCloseTo(0.00015 + 0.0003, 8)
  })

  it('estimates cost for a known Anthropic Claude model', () => {
    // claude-sonnet-4: input $0.003/1K, output $0.015/1K
    const cost = estimateCost({
      provider: 'anthropic',
      model: 'anthropic/claude-sonnet-4',
      promptTokens: 2000,
      completionTokens: 1000,
    })
    expect(cost).toBeCloseTo(0.006 + 0.015, 8)
  })

  it('estimates cost for a known Google Gemini model', () => {
    // gemini-2.0-flash: input $0.000075/1K, output $0.0003/1K
    const cost = estimateCost({
      provider: 'google',
      model: 'google/gemini-2.0-flash',
      promptTokens: 4000,
      completionTokens: 1000,
    })
    expect(cost).toBeCloseTo(0.0003 + 0.0003, 8)
  })

  it('uses conservative fallback for unknown model under openai provider', () => {
    const cost = estimateCost({
      provider: 'openai',
      model: 'openai/unknown-model',
      promptTokens: 1000,
      completionTokens: 1000,
    })
    // Falls back to generic openai: input $0.00015/1K, output $0.0006/1K
    expect(cost).toBeCloseTo(0.00015 + 0.0006, 8)
  })

  it('uses conservative fallback for unknown model under anthropic provider', () => {
    const cost = estimateCost({
      provider: 'anthropic',
      model: 'anthropic/some-future-model',
      promptTokens: 1000,
      completionTokens: 1000,
    })
    // Falls back to generic anthropic: $0.003 + $0.015
    expect(cost).toBeCloseTo(0.003 + 0.015, 8)
  })

  it('uses conservative fallback for unknown model under google provider', () => {
    const cost = estimateCost({
      provider: 'google',
      model: 'google/unknown',
      promptTokens: 1000,
      completionTokens: 1000,
    })
    // Falls back to generic google: $0.000075 + $0.0003
    expect(cost).toBeCloseTo(0.000075 + 0.0003, 8)
  })

  it('uses conservative estimate when no model specified for vercel_gateway', () => {
    const cost = estimateCost({
      provider: 'vercel_gateway',
      promptTokens: 1000,
      completionTokens: 1000,
    })
    // Default: input $0.001/1K, output $0.002/1K
    expect(cost).toBeCloseTo(0.001 + 0.002, 8)
  })

  it('returns 0 when no tokens', () => {
    const cost = estimateCost({
      provider: 'openai',
      model: 'openai/gpt-4o-mini',
      promptTokens: 0,
      completionTokens: 0,
    })
    expect(cost).toBe(0)
  })

  it('model key can omit provider prefix and be constructed', () => {
    // Model without explicit prefix should be constructed as `${provider}/${model}`
    const cost = estimateCost({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 1000,
      completionTokens: 1000,
    })
    // Should resolve to openai/gpt-4o-mini pricing: input 0.00015, output 0.0006
    expect(cost).toBeCloseTo(0.00015 + 0.0006, 8)
  })
})

describe('estimateCost — Perplexity', () => {
  it('uses per-1K-token pricing for a known model', () => {
    // sonar-pro: $0.003/1K total tokens
    const cost = estimateCost({
      provider: 'perplexity',
      model: 'sonar-pro',
      promptTokens: 1000,
      completionTokens: 500,
    })
    expect(cost).toBeCloseTo((1500 / 1000) * 0.003, 8)
  })

  it('falls back to default perplexity pricing for unknown model', () => {
    // default: $0.002/1K
    const cost = estimateCost({
      provider: 'perplexity',
      model: 'some-future-model',
      promptTokens: 2000,
      completionTokens: 0,
    })
    expect(cost).toBeCloseTo(2 * 0.002, 8)
  })
})

describe('estimateCost — external tools', () => {
  it('returns per-request cost for a known DataForSEO endpoint', () => {
    const cost = estimateCost({
      provider: 'dataforseo',
      endpoint: 'serp_organic_live_advanced',
    })
    expect(cost).toBe(0.0025)
  })

  it('uses default DataForSEO cost for unknown endpoint', () => {
    const cost = estimateCost({
      provider: 'dataforseo',
      endpoint: 'unknown_endpoint',
    })
    expect(cost).toBe(0.002)
  })

  it('uses default DataForSEO cost when endpoint omitted', () => {
    const cost = estimateCost({ provider: 'dataforseo' })
    expect(cost).toBe(0.002)
  })

  it('returns per-request cost for a known Firecrawl endpoint', () => {
    const cost = estimateCost({ provider: 'firecrawl', endpoint: 'scrape' })
    expect(cost).toBe(0.001)
  })

  it('uses default Firecrawl cost for unknown endpoint', () => {
    const cost = estimateCost({ provider: 'firecrawl', endpoint: 'unknown' })
    expect(cost).toBe(0.001)
  })

  it('returns per-request cost for Jina reader', () => {
    const cost = estimateCost({ provider: 'jina', endpoint: 'reader' })
    expect(cost).toBe(0.0001)
  })

  it('uses default Jina cost when endpoint omitted', () => {
    const cost = estimateCost({ provider: 'jina' })
    expect(cost).toBe(0.0001)
  })
})

describe('estimateCost — fallback', () => {
  it('returns 0.001 for an unrecognised provider', () => {
    // Cast to any to test the unknown-provider branch
    const cost = estimateCost({ provider: 'unknown_provider' as any })
    expect(cost).toBe(0.001)
  })
})

describe('extractProviderFromModel', () => {
  it('returns openai for openai/ prefix', () => {
    expect(extractProviderFromModel('openai/gpt-4o')).toBe('openai')
  })

  it('returns anthropic for anthropic/ prefix', () => {
    expect(extractProviderFromModel('anthropic/claude-opus-4')).toBe('anthropic')
  })

  it('returns google for google/ prefix', () => {
    expect(extractProviderFromModel('google/gemini-2.0-flash')).toBe('google')
  })

  it('returns gemini for gemini keyword without prefix', () => {
    expect(extractProviderFromModel('gemini-pro')).toBe('gemini')
  })

  it('returns anthropic for claude keyword without prefix', () => {
    expect(extractProviderFromModel('claude-sonnet')).toBe('anthropic')
  })

  it('returns openai for gpt keyword without prefix', () => {
    expect(extractProviderFromModel('gpt-4-turbo')).toBe('openai')
  })

  it('returns vercel_gateway for unknown model IDs', () => {
    expect(extractProviderFromModel('some-random-model')).toBe('vercel_gateway')
  })

  it('prefix takes priority over keyword matching', () => {
    // Explicitly prefixed models should match prefix, not keyword
    expect(extractProviderFromModel('openai/gpt-based-model')).toBe('openai')
    expect(extractProviderFromModel('anthropic/claude-like-model')).toBe('anthropic')
  })
})
