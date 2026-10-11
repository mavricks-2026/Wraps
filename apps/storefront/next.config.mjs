/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const nextConfig = {
  transpilePackages: ['@goodsly/ui', '@goodsly/utils', '@goodsly/types'],
  reactStrictMode: true,
  // Don't fail production builds on lint; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      ...(supabaseUrl
        ? [
            {
              protocol: new URL(supabaseUrl).protocol.replace(':', ''),
              hostname: new URL(supabaseUrl).hostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
