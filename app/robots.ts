import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

const baseUrl = SITE_URL

export default function robots(): MetadataRoute.Robots {
  const disallowPaths = [
    '/api/',
    '/admin/',
    '/dashboard/',
    '/onboarding/',
    '/login/',
    '/signup/',
    '/sign-in/',
    '/sign-up/',
    '/user-profile/',
    '/auth/',
    '/test-tailwind/',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
      },
      // Explicitly allow AI crawlers for AEO visibility
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: disallowPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
