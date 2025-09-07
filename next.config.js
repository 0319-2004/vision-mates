/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14ではappDirがデフォルトで有効
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async rewrites() {
    return [
      { source: '/project/:id', destination: '/projects/:id' },
      { source: '/project/:id/threads', destination: '/projects/:id/threads' },
      { source: '/project/:id/threads/:threadId', destination: '/projects/:id/threads/:threadId' }
    ]
  },
}

module.exports = nextConfig 