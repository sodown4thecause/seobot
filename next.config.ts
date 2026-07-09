import type { NextConfig } from 'next'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flow-intent-126ee12.ingress-erytho.ewp.live',
      },
      {
        protocol: 'https',
        hostname: 'uploads-ssl.webflow.com',
      },
      {
        protocol: 'https',
        hostname: 'assets-global.website-files.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/aeo-vs-seo',
        destination: '/blog/aeo-vs-geo',
        permanent: true,
      },
      {
        source: '/docs',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/guides',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/guides/:slug*',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/resources',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/resources/:slug*',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/#faq',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/#faq',
        permanent: true,
      },
    ]
  },
}

let exportedConfig: NextConfig = nextConfig

try {
  const { withSentryConfig } = require('@sentry/nextjs') as typeof import('@sentry/nextjs')
  exportedConfig = withSentryConfig(nextConfig, {
    silent: true,
    disableLogger: true,
  })
} catch {
  // Sentry unavailable (e.g. incomplete local install). Skip wrapping so
  // local dev can still boot; production behavior is preserved when present.
  console.warn('[next.config] @sentry/nextjs unavailable; skipping Sentry config wrapper.')
}

export default exportedConfig
