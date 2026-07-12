import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('observability ownership', () => {
  it('does not retain Sentry references in active runtime files', async () => {
    const files = [
      'instrumentation.ts',
      'next.config.ts',
      'lib/errors/logger.ts',
      'lib/config/env.ts',
      '.env.example',
    ]
    const contents = await Promise.all(files.map((file) => readFile(file, 'utf8')))

    expect(contents.join('\n')).not.toMatch(/sentry|@sentry/i)
  })
})
