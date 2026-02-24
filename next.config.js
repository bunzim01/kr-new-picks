/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  // node:sqlite 는 Node.js 24 내장 모듈 — 번들링 제외
  serverExternalPackages: [],
}

module.exports = nextConfig
