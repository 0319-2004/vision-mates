/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14ではappDirがデフォルトで有効
  async rewrites() {
    return [
      { source: '/project/:id', destination: '/projects/:id' },
      { source: '/project/:id/threads', destination: '/projects/:id/threads' },
      { source: '/project/:id/threads/:threadId', destination: '/projects/:id/threads/:threadId' }
    ]
  },
}

module.exports = nextConfig 