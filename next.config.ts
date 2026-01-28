import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  // This creates a minimal production build with only necessary files
  output: "standalone",

  // Experimental features
  experimental: {
    // Enable server actions (default in Next.js 14+, but explicit for clarity)
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Image optimization configuration
  images: {
    // Configure remote patterns if needed for external images
    remotePatterns: [],
    // Disable image optimization in development for faster builds
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
