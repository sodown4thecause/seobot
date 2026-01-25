import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { SITE_URL } from '@/lib/seo/site'

const baseUrl = SITE_URL

const LAST_MODIFIED = new Date()

// Fetch slugs from Sanity
async function getSanitySlugs(type: string): Promise<Array<{ slug: string; publishedAt: string }>> {
  try {
    const results = await client.fetch(
      `*[_type == $type && defined(slug.current)]{
        "slug": slug.current,
        publishedAt
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
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/prices`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Dynamic routes from Sanity
  try {
    const [blogSlugs, resourceSlugs, caseStudySlugs, guideSlugs] = await Promise.all([
      getSanitySlugs('post'),
      getSanitySlugs('resource'),
      getSanitySlugs('caseStudy'),
      getSanitySlugs('guide'),
    ])

    const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((item) => ({
      url: `${baseUrl}/blog/${item.slug}`,
      lastModified: item.publishedAt ? new Date(item.publishedAt) : LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const resourceRoutes: MetadataRoute.Sitemap = resourceSlugs.map((item) => ({
      url: `${baseUrl}/resources/${item.slug}`,
      lastModified: item.publishedAt ? new Date(item.publishedAt) : LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    const caseStudyRoutes: MetadataRoute.Sitemap = caseStudySlugs.map((item) => ({
      url: `${baseUrl}/case-studies/${item.slug}`,
      lastModified: item.publishedAt ? new Date(item.publishedAt) : LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    const guideRoutes: MetadataRoute.Sitemap = guideSlugs.map((item) => ({
      url: `${baseUrl}/guides/${item.slug}`,
      lastModified: item.publishedAt ? new Date(item.publishedAt) : LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticRoutes, ...blogRoutes, ...resourceRoutes, ...caseStudyRoutes, ...guideRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static routes if Sanity fetch fails
    return staticRoutes
  }
}
