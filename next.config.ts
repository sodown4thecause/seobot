import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Enable instrumentation for Langfuse OpenTelemetry
  // Note: instrumentationHook is enabled by default in Next.js 15+
  experimental: {},
  images: {
    remotePatterns: [
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

};


export default nextConfig;