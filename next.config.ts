import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Enable instrumentation hook for Langfuse OpenTelemetry
  experimental: {
    instrumentationHook: true,
  },
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