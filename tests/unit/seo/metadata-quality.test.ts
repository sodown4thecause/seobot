import { describe, expect, it } from 'vitest'
import { metadata as homeMetadata } from '@/app/page'
import { metadata as blogMetadata } from '@/app/blog/page'
import { metadata as privacyMetadata } from '@/app/privacy/page'
import { metadata as termsMetadata } from '@/app/terms/page'

describe('public page metadata quality', () => {
  it.each([
    ['home', homeMetadata],
    ['blog', blogMetadata],
    ['privacy', privacyMetadata],
    ['terms', termsMetadata],
  ])('keeps the %s description within a useful snippet range', (_name, metadata) => {
    expect(typeof metadata.description).toBe('string')
    expect((metadata.description as string).length).toBeGreaterThanOrEqual(110)
    expect((metadata.description as string).length).toBeLessThanOrEqual(160)
  })
})
