import type { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/webflow'
import { getCaseStudies } from '@/lib/case-studies'
import { absoluteUrl } from '@/lib/seo/site'

type SitemapEntry = MetadataRoute.Sitemap[number]

const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: SitemapEntry['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/prices', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/audit', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/aeo-auditor', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/reddit-gap', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/case-studies', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
]

function toSitemapEntry(
  path: string,
  options: {
    lastModified?: string | Date | null
    changeFrequency?: SitemapEntry['changeFrequency']
    priority?: number
  } = {},
): SitemapEntry {
  return {
    url: absoluteUrl(path),
    ...(options.lastModified ? { lastModified: new Date(options.lastModified) } : {}),
    ...(options.changeFrequency ? { changeFrequency: options.changeFrequency } : {}),
    ...(options.priority ? { priority: options.priority } : {}),
  }
}

export async function getIndexableRoutes(): Promise<MetadataRoute.Sitemap> {
  const routes = STATIC_ROUTES.map((route) =>
    toSitemapEntry(route.path, {
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }),
  )

  try {
    const posts = await getBlogPosts(300)
    const caseStudies = getCaseStudies()

    routes.push(
      ...posts
        .filter((post) => post.slug)
        .map((post) =>
          toSitemapEntry(`/blog/${post.slug}`, {
            lastModified: post.lastUpdated ?? post.lastPublished ?? post.createdOn,
            changeFrequency: 'weekly',
            priority: post.featured ? 0.85 : 0.7,
          }),
        ),
      ...caseStudies
        .map((study) =>
          toSitemapEntry(`/case-studies/${study.slug}`, {
            changeFrequency: 'monthly',
            priority: 0.65,
          }),
        ),
    )
  } catch (error) {
    console.warn('[SEO] Falling back to static sitemap routes:', error)
  }

  return routes
}

export async function getIndexableUrls(): Promise<string[]> {
  const routes = await getIndexableRoutes()
  return routes.map((route) => route.url)
}
