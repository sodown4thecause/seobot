import { describe, expect, it } from 'vitest'
import { validateEnvironment } from '@/scripts/validate-env'

const validProductionEnv = {
  DATABASE_URL: 'https://db.flowintent.com/production',
  BETTER_AUTH_SECRET: 'test-secret-with-more-than-32-characters',
  BETTER_AUTH_URL: 'https://flowintent.com',
  NEXT_PUBLIC_SITE_URL: 'https://flowintent.com',
  CRON_SECRET: 'cron-secret-with-more-than-16-characters',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'google-client-id',
  POLAR_ACCESS_TOKEN: 'polar-token',
  POLAR_PRODUCT_ID: 'polar-product',
  POLAR_WEBHOOK_SECRET: 'polar-webhook-secret',
  AI_GATEWAY_API_KEY: 'gateway-key',
  DATAFORSEO_USERNAME: 'dataforseo-user',
  DATAFORSEO_PASSWORD: 'dataforseo-password',
}

describe('validateEnvironment', () => {
  it('accepts a complete production contract', () => {
    expect(validateEnvironment(validProductionEnv, 'production').errors).toEqual([])
  })

  it('rejects missing production values', () => {
    expect(validateEnvironment({}, 'production').errors).toEqual(expect.arrayContaining([
      'Missing required variable: DATABASE_URL',
      'Missing required variable: BETTER_AUTH_SECRET',
      'Missing required variable: CRON_SECRET',
    ]))
  })

  it('allows local development without production integrations', () => {
    expect(validateEnvironment({}, 'local').errors).toEqual([])
  })

  it('rejects placeholder URLs in production', () => {
    const placeholderEnvs = [
      { DATABASE_URL: 'postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb' },
      { DATABASE_URL: 'https://db.example.test/production' },
      { NEXT_PUBLIC_SITE_URL: 'https://your-site.example.com' },
      { BETTER_AUTH_URL: 'https://replaceme.example.com' },
      { BETTER_AUTH_URL: 'https://replace-me.flowintent.com' },
      { BETTER_AUTH_URL: 'https://replace_me.flowintent.com' },
    ]

    for (const env of placeholderEnvs) {
      expect(validateEnvironment({ ...validProductionEnv, ...env }, 'production').errors)
        .toContainEqual(expect.stringContaining('placeholder URLs'))
    }
  })

  it('permits blank optional local values but rejects malformed present URLs', () => {
    const result = validateEnvironment({
      DATAFORSEO_USERNAME: '',
      DATAFORSEO_PASSWORD: 'local-password',
      NEXT_PUBLIC_SITE_URL: 'not-a-url',
      XAI_BASE_URL: 'not-a-url',
    }, 'local')

    expect(result.errors).toEqual(expect.arrayContaining([
      'Invalid variable NEXT_PUBLIC_SITE_URL: must be a valid URL',
      'Invalid variable XAI_BASE_URL: must be a valid URL',
    ]))
    expect(result.errors).not.toContain('Invalid variable DATAFORSEO_USERNAME: must not be empty')
  })

  it('permits blank optional production and model variables in local mode', () => {
    expect(validateEnvironment({
      DATABASE_URL: '',
      AI_GATEWAY_API_KEY: '',
      OPENAI_API_KEY: '',
      DATAFORSEO_USERNAME: '',
      DATAFORSEO_PASSWORD: '',
    }, 'local').errors).toEqual([])
  })
})
