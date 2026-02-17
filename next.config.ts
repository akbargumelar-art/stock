import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip build-time execution of routes to prevent database connection errors
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
