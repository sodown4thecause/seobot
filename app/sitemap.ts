import type { MetadataRoute } from 'next'
import { getAllPostSlugs, getAllCaseStudySlugs, getAllResourceSlugs } from '@/lib/wordpress'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowintent.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/prices`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Dynamic routes from WordPress
  try {
    const [blogSlugs, resourceSlugs, caseStudySlugs] = await Promise.all([
      getAllPostSlugs(),
      getAllResourceSlugs(),
      getAllCaseStudySlugs(),
    ])

    const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const resourceRoutes: MetadataRoute.Sitemap = resourceSlugs.map((slug) => ({
      url: `${baseUrl}/resources/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    const caseStudyRoutes: MetadataRoute.Sitemap = caseStudySlugs.map((slug) => ({
      url: `${baseUrl}/case-studies/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // Guide routes
    const guideRoutes: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/guides/answer-engine-optimization`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/guides/aeo-vs-geo`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/guides/chatgpt-seo`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ]

    return [...staticRoutes, ...blogRoutes, ...resourceRoutes, ...caseStudyRoutes, ...guideRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static routes if WordPress fetch fails
    return staticRoutes
  }
}

