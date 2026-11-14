import type { NextConfig } from "next";
import path from "node:path";
import { authApiOrigin } from './src/server/authProxy';

const authOrigin = authApiOrigin();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  async rewrites() {
    // Keep the refresh cookie on the frontend host. The backend still checks the
    // original browser Origin and its non-simple session header.
    return [{ source: '/api/auth/:path*', destination: `${authOrigin}/api/auth/:path*` }];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
