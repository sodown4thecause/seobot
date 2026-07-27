import { beforeEach, describe, expect, it, vi } from 'vitest'

const getBlogPostsMock = vi.hoisted(() => vi.fn())

vi.mock('server-only', () => ({}))
vi.mock('@/lib/webflow', () => ({
  getBlogPosts: getBlogPostsMock,
}))

import { getIndexableRoutes } from '@/lib/seo/indexable-routes'

describe('getIndexableRoutes', () => {
  beforeEach(() => {
    getBlogPostsMock.mockReset()
    getBlogPostsMock.mockResolvedValue([])
  })

  it('publishes only case-study URLs that the local route can render', async () => {
    const paths = (await getIndexableRoutes()).map((entry) => new URL(entry.url).pathname)

    expect(paths).toContain('/case-studies/reddit-gap-to-ai-citations')
    expect(paths).toContain('/case-studies/keyword-gaps-to-pageone')
    expect(paths).not.toContain('/case-studies/content-research-firecrawl-sonar-canva')
    expect(paths).not.toContain('/diagnostic')
  })
})
