/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@goodsly/ui', '@goodsly/utils', '@goodsly/types'],
  reactStrictMode: true,
  // Don't fail production builds on lint; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
