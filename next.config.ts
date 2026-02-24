import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: true,
    // Enable instrumentation for Langfuse OpenTelemetry
    // Note: instrumentationHook is enabled by default in Next.js 15+
    experimental: {
        // Enable Next.js 16 cache directive support
        cacheComponents: true,
        cacheLife: {
            rankings: {
                stale: 21600,
                revalidate: 43200,
                expire: 86400,
            },
            backlinks: {
                stale: 172800,
                revalidate: 259200,
                expire: 604800,
            },
            audit: {
                stale: 86400,
                revalidate: 172800,
                expire: 259200,
            },
            competitor: {
                stale: 43200,
                revalidate: 86400,
                expire: 172800,
            },
        },
    },
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

};


export default nextConfig;
