/**
 * robots.txt — tenant-aware. Emits the active brand's sitemap URL so each
 * single-tenant deployment advertises only its own domain. For the default
 * tenant (floridahomefinder) the output is byte-for-byte identical to the
 * former static public/robots.txt.
 */

import { tenant } from '@/configs/tenant.config'

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /login
Disallow: /account
Disallow: /recently-viewed
Disallow: /compare
Disallow: /unsubscribe
Crawl-delay: 1

# Allow search with parameters (pagination, filters)
Allow: /search/*

Sitemap: ${tenant.brand.siteUrl}/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
