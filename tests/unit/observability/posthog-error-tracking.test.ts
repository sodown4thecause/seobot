import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('PostHog error tracking ownership', () => {
  it('uses PostHog for browser and server exceptions', () => {
    expect(read('instrumentation-client.ts')).toContain('capture_exceptions: true')
    expect(read('components/providers/analytics-provider.tsx')).toContain('posthog.captureException')
    expect(read('lib/analytics/posthog-server.ts')).toContain('captureExceptionImmediate')
    expect(read('instrumentation.ts')).toContain('captureServerException')
    expect(read('app/error.tsx')).toContain('captureClientException')
    expect(read('app/global-error.tsx')).toContain('captureClientException')
  })

  it('has no Sentry runtime or package ownership', () => {
    expect(read('package.json')).not.toContain('@sentry/nextjs')
    expect(read('next.config.ts')).not.toContain('Sentry')
    expect(read('instrumentation.ts')).not.toContain('Sentry')
    expect(read('lib/errors/logger.ts')).not.toContain('Sentry')
  })
})
