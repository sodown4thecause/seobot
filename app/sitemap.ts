import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

const baseUrl = SITE_URL

const FALLBACK_LAST_MODIFIED = new Date()

type SanityContentRoute = {
  type: 'post' | 'guide' | 'resource' | 'caseStudy'
  pathPrefix: '/blog' | '/guides' | '/resources' | '/case-studies'
  changeFrequency: 'weekly' | 'monthly'
  priority: number
}

type SanitySlug = {
  slug: string
  publishedAt?: string
  updatedAt?: string
}

type SanityClientLike = {
  fetch<T>(query: string, params: Record<string, unknown>, options: Record<string, unknown>): Promise<T>
}

function getSanityConfig(): { projectId: string; dataset: string; apiVersion: string } | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  if (!projectId) {
    return null
  }

  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  const dataset = configuredDataset === 'preview' ? 'production' : configuredDataset || 'production'

  return {
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-02',
  }
}

async function getSanityClient(): Promise<SanityClientLike | null> {
  const config = getSanityConfig()
  if (!config) {
    return null
  }

  const { createClient } = await import('next-sanity')
  return createClient({
    ...config,
    useCdn: false,
  })
}

const SANITY_CONTENT_ROUTES: SanityContentRoute[] = [
  { type: 'post', pathPrefix: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { type: 'guide', pathPrefix: '/guides', changeFrequency: 'weekly', priority: 0.8 },
  { type: 'resource', pathPrefix: '/resources', changeFrequency: 'monthly', priority: 0.6 },
  { type: 'caseStudy', pathPrefix: '/case-studies', changeFrequency: 'monthly', priority: 0.6 },
]

const STATIC_PUBLIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/prices', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/audit', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/guides/llm-mentions', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/guides/aeo-audit-playbook', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/guides/answer-engine-optimization', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/guides/chatgpt-seo', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/guides/aeo-vs-geo', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/resources', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/case-studies', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/docs', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/aeo-auditor', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.3 },
]

// Fetch published slugs from Sanity for sitemap-safe URLs only
async function getSanitySlugs(type: SanityContentRoute['type']): Promise<SanitySlug[]> {
  const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET

  if (!sanityProjectId || !sanityDataset) {
    return []
  }

  try {
    const sanityClient = await getSanityClient()
    if (!sanityClient) {
      return []
    }

    const results = await sanityClient.fetch<SanitySlug[]>(
      `*[
        _type == $type &&
        defined(slug.current) &&
        !(_id in path("drafts.**")) &&
        !(_id in path("versions.**"))
      ]{
        "slug": slug.current,
        publishedAt,
        "updatedAt": _updatedAt
      }`,
      { type },
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    return results || []
  } catch (error) {
    console.error(`Error fetching ${type} slugs:`, error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: FALLBACK_LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const dynamicRouteGroups = await Promise.all(
    SANITY_CONTENT_ROUTES.map(async (routeConfig) => {
      const slugs = await getSanitySlugs(routeConfig.type)

      return slugs
        .filter((item) => Boolean(item.slug))
        .map((item) => ({
          url: `${baseUrl}${routeConfig.pathPrefix}/${item.slug}`,
          lastModified: item.updatedAt
            ? new Date(item.updatedAt)
            : item.publishedAt
              ? new Date(item.publishedAt)
              : FALLBACK_LAST_MODIFIED,
          changeFrequency: routeConfig.changeFrequency,
          priority: routeConfig.priority,
        }))
    })
  )

  // Dedupe any accidental overlaps and keep only valid public URLs
  const uniqueByUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const route of [...staticRoutes, ...dynamicRouteGroups.flat()]) {
    uniqueByUrl.set(route.url, route)
  }

  return Array.from(uniqueByUrl.values())
}
