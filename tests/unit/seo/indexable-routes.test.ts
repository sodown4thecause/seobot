import { beforeEach, describe, expect, it, vi } from 'vitest'

const getBlogPostsMock = vi.hoisted(() => vi.fn())
const getWebflowCaseStudiesMock = vi.hoisted(() => vi.fn())

vi.mock('server-only', () => ({}))
vi.mock('@/lib/webflow', () => ({
  getBlogPosts: getBlogPostsMock,
  getCaseStudies: getWebflowCaseStudiesMock,
}))

import { getIndexableRoutes } from '@/lib/seo/indexable-routes'

describe('getIndexableRoutes', () => {
  beforeEach(() => {
    getBlogPostsMock.mockReset()
    getBlogPostsMock.mockResolvedValue([])
    getWebflowCaseStudiesMock.mockReset()
    getWebflowCaseStudiesMock.mockResolvedValue([
      {
        id: 'cms-only',
        slug: 'content-research-firecrawl-sonar-canva',
        name: 'CMS-only case study',
        body: '<p>Not rendered by the local case-study route.</p>',
        summary: null,
        mainImage: null,
        thumbnailImage: null,
        lastPublished: null,
        lastUpdated: '2026-05-01T00:00:00.000Z',
        createdOn: '2026-05-01T00:00:00.000Z',
      },
    ])
  })

  it('publishes only case-study URLs that the local route can render', async () => {
    const urls = (await getIndexableRoutes()).map((entry) => entry.url)

    expect(urls).toContain('https://flowintent.com/case-studies/reddit-gap-to-ai-citations')
    expect(urls).toContain('https://flowintent.com/case-studies/keyword-gaps-to-pageone')
    expect(urls).not.toContain(
      'https://flowintent.com/case-studies/content-research-firecrawl-sonar-canva',
    )
    expect(urls).not.toContain('https://flowintent.com/diagnostic')
  })
})
