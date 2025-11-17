import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Suppress hydration warnings caused by browser extensions
  // (e.g., rtrvr-listeners attribute added by retriever extensions)
  experimental: {
    // This helps reduce false positive hydration warnings
  },
};

export default nextConfig;
