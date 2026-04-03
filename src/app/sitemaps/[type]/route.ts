/**
 * Dynamic sitemap generator — /sitemaps/[type]
 *
 * Supported types: active, sold, pages, blog, static
 * Each generates an XML sitemap with the appropriate entries.
 */

import { NextResponse } from 'next/server'

import { targetCounties, subTypes } from '@configs/page-generation'
import { fetchCountyCities, fetchSubTypeCount } from 'services/pageGeneration'
import { scoreAreaPage } from 'utils/areaPageScoring'

const BASE_URL = 'https://floridahomefinder.com'

type SitemapType = 'active' | 'sold' | 'pages' | 'blog' | 'static'

interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

// ─── Generators ───────────────────────────────────────────────────

async function generateActive(): Promise<SitemapEntry[]> {
  try {
    const { APISearch } = await import('services/API')
    const { generateStaticPropertyUrl } = await import('utils/propertyUrls')

    const response = await APISearch.fetch(
      {
        get: {
          status: 'A',
          resultsPerPage: 500,
          sortBy: 'createdOnDesc',
          listings: true,
          fields: 'mlsNumber,address,updatedOn',
        },
        post: {},
      },
      undefined
    )

    if (!response?.listings) return []

    return response.listings.map((listing: any) => ({
      url: `${BASE_URL}${generateStaticPropertyUrl(listing.address || {})}`,
      lastmod: listing.updatedOn
        ? new Date(listing.updatedOn).toISOString()
        : new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8,
    }))
  } catch {
    return []
  }
}

async function generateSold(): Promise<SitemapEntry[]> {
  try {
    // Try loading from property index first (pre-scored)
    const { loadPropertyIndex } = await import('services/propertyIndex')
    const index = await loadPropertyIndex()

    if (index.length > 0) {
      return index
        .filter((entry) => entry.score >= 1)
        .map((entry) => ({
          url: `${BASE_URL}/homes/${entry.slug}`,
          lastmod: entry.lastUpdated
            ? new Date(entry.lastUpdated).toISOString()
            : new Date().toISOString(),
          changefreq: entry.score >= 3 ? 'monthly' : 'yearly',
          priority: entry.score >= 3 ? 0.6 : 0.3,
        }))
    }

    // Fallback: fetch from API and score
    const APISearchCSR = (await import('services/API/APISearchCSR')).default
    const { generateStaticPropertyUrl } = await import('utils/propertyUrls')
    const { scorePropertyPage } = await import('utils/propertyPageScoring')

    const result = await APISearchCSR.searchListings({
      status: 'U',
      lastStatus: 'Sld',
      resultsPerPage: 500,
      sortBy: 'updatedOnDesc',
    })

    if (!result?.listings) return []

    const entries: SitemapEntry[] = []
    for (const listing of result.listings) {
      const pageScore = scorePropertyPage({
        status: listing.status,
        lastStatus: listing.lastStatus,
        soldDate: listing.soldDate ?? undefined,
        soldPrice: listing.soldPrice,
        images: listing.images,
        history: listing.history,
        estimate: listing.estimate,
        details: listing.details
          ? { description: listing.details.description }
          : null,
        address: listing.address
          ? { city: listing.address.city, area: listing.address.area }
          : null,
      })

      if (pageScore.score >= 1) {
        entries.push({
          url: `${BASE_URL}${generateStaticPropertyUrl(listing.address || {})}`,
          lastmod: listing.updatedOn
            ? new Date(listing.updatedOn).toISOString()
            : new Date().toISOString(),
          changefreq: pageScore.score >= 3 ? 'monthly' : 'yearly',
          priority: pageScore.score >= 3 ? 0.6 : 0.3,
        })
      }
    }

    return entries
  } catch {
    return []
  }
}

async function generatePages(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  try {
    for (const county of targetCounties) {
      const cities = await fetchCountyCities(county)
      for (const city of cities) {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, '-')

        // Score city page
        const cityCount = city.activeCount ?? 0
        const cityScore = scoreAreaPage({ pageType: 'city', listingCount: cityCount })
        if (cityScore.score >= 1) {
          entries.push({
            url: `${BASE_URL}/${citySlug}`,
            lastmod: new Date().toISOString(),
            changefreq: cityScore.score >= 3 ? 'weekly' : 'monthly',
            priority: cityScore.score >= 3 ? 0.7 : 0.3,
          })
        }

        // Score each sub-type page
        for (const st of subTypes) {
          const stCount = await fetchSubTypeCount(city.name, st)
          const stScore = scoreAreaPage({ pageType: 'subType', listingCount: stCount, subTypeSlug: st.slug })
          if (stScore.score >= 1) {
            entries.push({
              url: `${BASE_URL}/${citySlug}/${st.slug}`,
              lastmod: new Date().toISOString(),
              changefreq: stScore.score >= 3 ? 'weekly' : 'monthly',
              priority: stScore.score >= 3 ? 0.7 : 0.3,
            })
          }
        }
      }
    }
  } catch { /* API not available */ }
  return entries
}

async function generateBlog(): Promise<SitemapEntry[]> {
  try {
    const APIBlogs = (await import('services/API/APIBlogs')).default
    const { blogs } = await APIBlogs.getBlogs({ status: 'published', limit: 1000 })

    return blogs.map(
      (blog: { slug: string; updated_at: Date; published_at: Date | null }) => ({
        url: `${BASE_URL}/blog/${blog.slug}`,
        lastmod: new Date(
          blog.updated_at || blog.published_at || new Date()
        ).toISOString(),
        changefreq: 'monthly',
        priority: 0.6,
      })
    )
  } catch {
    return []
  }
}

function generateStatic(): SitemapEntry[] {
  const now = new Date().toISOString()
  return [
    { url: BASE_URL, lastmod: now, changefreq: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastmod: now, changefreq: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastmod: now, changefreq: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/listings`, lastmod: now, changefreq: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/agents`, lastmod: now, changefreq: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/home-value`, lastmod: now, changefreq: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/search/gallery`, lastmod: now, changefreq: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/search/advanced`, lastmod: now, changefreq: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastmod: now, changefreq: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastmod: now, changefreq: 'yearly', priority: 0.5 },
  ]
}

// ─── Route handler ────────────────────────────────────────────────

const generators: Record<SitemapType, () => Promise<SitemapEntry[]> | SitemapEntry[]> = {
  active: generateActive,
  sold: generateSold,
  pages: generatePages,
  blog: generateBlog,
  static: generateStatic,
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params

  const generator = generators[type as SitemapType]
  if (!generator) {
    return NextResponse.json({ error: 'Invalid sitemap type' }, { status: 404 })
  }

  const entries = await generator()

  const urlEntries = entries.map(
    (e) =>
      `  <url>\n    <loc>${escapeXml(e.url)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ''}${e.priority != null ? `\n    <priority>${e.priority}</priority>` : ''}\n  </url>`
  )

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    '</urlset>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}