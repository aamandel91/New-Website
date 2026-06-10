/**
 * Sitemap index — points to per-type sitemaps at /sitemaps/[type]
 */

const BASE_URL = 'https://floridahomefinder.com'

const SITEMAP_TYPES = ['active', 'sold', 'pages', 'blog', 'static'] as const

export async function GET() {
  const now = new Date().toISOString()

  const entries = SITEMAP_TYPES.map(
    (type) =>
      `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${type}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`
  )

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>'
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
