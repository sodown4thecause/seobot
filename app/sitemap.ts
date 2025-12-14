import type { MetadataRoute } from 'next'
import { getAllPostSlugs, getAllCaseStudySlugs, getAllResourceSlugs } from '@/lib/wordpress'
import { statSync } from 'fs'
import { join } from 'path'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowintent.com'

// Fallback date: December 14, 2025 (when SEO foundation was added)
const FALLBACK_DATE = new Date('2025-12-14T00:00:00Z')

/**
 * Get the last modified date for a file path relative to the project root
 * Falls back to FALLBACK_DATE if file doesn't exist or can't be read
 */
function getFileLastModified(filePath: string): Date {
  try {
    const fullPath = join(process.cwd(), filePath)
    const stats = statSync(fullPath)
    return stats.mtime
  } catch (error) {
    // File doesn't exist or can't be read, use fallback
    return FALLBACK_DATE
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes with real file modification times
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: getFileLastModified('app/page.tsx'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/prices`,
      lastModified: getFileLastModified('app/prices/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: getFileLastModified('app/blog/page.tsx'),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: getFileLastModified('app/guides/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: getFileLastModified('app/faq/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: getFileLastModified('app/docs/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: getFileLastModified('app/contact/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: getFileLastModified('app/privacy/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: getFileLastModified('app/terms/page.tsx'),
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

    // WordPress dynamic routes use fallback date since they're fetched from WordPress
    // (modification dates would need to be fetched from WordPress GraphQL if available)
    const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: FALLBACK_DATE,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const resourceRoutes: MetadataRoute.Sitemap = resourceSlugs.map((slug) => ({
      url: `${baseUrl}/resources/${slug}`,
      lastModified: FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    const caseStudyRoutes: MetadataRoute.Sitemap = caseStudySlugs.map((slug) => ({
      url: `${baseUrl}/case-studies/${slug}`,
      lastModified: FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // Guide routes with real file modification times
    const guideRoutes: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/guides/answer-engine-optimization`,
        lastModified: getFileLastModified('app/guides/answer-engine-optimization/page.tsx'),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/guides/aeo-vs-geo`,
        lastModified: getFileLastModified('app/guides/aeo-vs-geo/page.tsx'),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/guides/chatgpt-seo`,
        lastModified: getFileLastModified('app/guides/chatgpt-seo/page.tsx'),
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

