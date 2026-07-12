import { describe, expect, it } from 'vitest'
import { validateEnvironment } from '@/scripts/validate-env'

const validProductionEnv = {
  DATABASE_URL: 'https://db.example.test/production',
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
})
