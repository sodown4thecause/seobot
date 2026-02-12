import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowintent.com'

export default function robots(): MetadataRoute.Robots {
  const disallowPaths = [
    '/api/',
    '/admin/',
    '/dashboard/',
    '/onboarding/',
    '/login/',
    '/signup/',
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

