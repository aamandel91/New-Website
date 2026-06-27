/** @type {import('next').NextConfig} */

import createMDX from '@next/mdx'

import createNextIntlPlugin from 'next-intl/plugin'

const currentEnv = process.env.NODE_ENV

const loggingConfig =
  currentEnv === 'development'
    ? {
        logging: {
          fetches: {
            fullUrl: true,
            hmrRefreshes: false
          }
        }
      }
    : {}

const nextConfig = {
  eslint: {
    // Lint errors block bad deploys. If you need to land a hotfix past lint,
    // flip this to `true` temporarily and open a follow-up to clean it up.
    ignoreDuringBuilds: false
  },

  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx', 'md'],
  trailingSlash: false,
  reactStrictMode: true,
  compress: true,
  images: {
    minimumCacheTTL: 3600,
    path: '/_next/image',
    contentDispositionType: 'attachment',
    disableStaticImages: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.repliers.io'
      },
      {
        protocol: 'https',
        hostname: '*.repliers.io'
      },
      {
        protocol: 'https',
        hostname: '*.mapbox.com'
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/florida/:path*',
        destination: '/:path*',
        permanent: true
      }
    ]
  },
  ...loggingConfig
}

const withMDX = createMDX({
  /* Add markdown plugins here, as desired */
})

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(withMDX(nextConfig))
