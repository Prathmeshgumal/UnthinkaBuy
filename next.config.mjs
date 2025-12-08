/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/recommendations/:path*',
        destination: 'http://127.0.0.1:8000/api/recommendations/:path*',
      },
    ]
  },
}

export default nextConfig
