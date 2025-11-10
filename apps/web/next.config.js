/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // In production, API calls should go to the same server (Fastify will handle them)
    // In development, this won't be used since we run servers separately
    return []
  },
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig

