import { describe, expect, it } from 'vitest'
import { siteSchemaMarkup } from '@/lib/seo/site-schema'

describe('site-wide structured data', () => {
  it('limits global markup to site identity entities valid on every page', () => {
    expect(siteSchemaMarkup['@graph'].map((entity) => entity['@type'])).toEqual([
      'WebSite',
      'Organization',
    ])
  })
})
