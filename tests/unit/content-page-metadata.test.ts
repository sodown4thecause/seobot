import { describe, expect, it } from 'vitest'
import { metadata as blogMetadata } from '@/app/blog/page'
import { metadata as guidesMetadata } from '@/app/guides/page'
import { metadata as resourcesMetadata } from '@/app/resources/page'
import { metadata as caseStudiesMetadata } from '@/app/case-studies/page'

describe('content page metadata', () => {
  it('restores canonical and social metadata for public content pages', () => {
    for (const metadata of [blogMetadata, guidesMetadata, resourcesMetadata, caseStudiesMetadata]) {
      expect(metadata.alternates?.canonical).toBeTruthy()
      expect(metadata.openGraph?.url).toBeTruthy()
      expect(metadata.twitter?.card).toBe('summary_large_image')
    }
  })
})
