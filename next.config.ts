import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Run webpack directly to avoid the build worker TCP binding that fails in restricted sandboxes.
    webpackBuildWorker: false,
  },
};

export default nextConfig;
