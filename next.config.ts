import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'flow-intent-126ee12.ingress-erytho.ewp.live',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'uploads-ssl.webflow.com',
      },
      {
        protocol: 'https',
        hostname: 'assets-global.website-files.com',
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

export default nextConfig
