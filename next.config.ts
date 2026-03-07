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
    ],
  },
  async redirects() {
    return [
      {
        source: '/aeo-vs-seo',
        destination: '/guides/aeo-vs-geo',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
