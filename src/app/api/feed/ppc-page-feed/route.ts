/**
 * PPC Page Feed for Google Dynamic Search Ads
 *
 * Generates a page-level feed of high-value area/sub-type pages suitable for
 * Google DSA campaigns. Filters by avg price and listing count so only
 * pages with real inventory and high AOV enter the paid funnel.
 *
 * Usage:
 *   GET /api/feed/ppc-page-feed?format=csv|json&type=pages|customizers&refresh=true|false
 *       &minAvgPrice=700000&minListings=5
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import path from 'path'

import type { SubTypeConfig } from '@configs/page-generation'
import { subTypes } from '@configs/page-generation'
import type { PriceTier } from '@configs/ppc-feed'
import { ppcFeedConfig } from '@configs/ppc-feed'

import fs from 'fs/promises'

import { toCSV } from 'services/marketing'

// ── Types ────────────────────────────────────────────────────────────────────

interface PPCPageEntry {
  url: string
  type: 'subType' | 'neighborhood'
  city: string
  name: string
  listingCount: number
  avgPrice: number
  medianPrice: number
  priceTier: string
}

interface PPCFeedCache {
  timestamp: string
  entries: PPCPageEntry[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const CSR_API_URL = 'https://csr-api.repliers.io'
const CSR_API_KEY = process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY || ''
const BOARD_ID = 110
const CACHE_PATH = path.join(process.cwd(), 'data', 'ppc-feed-cache.json')
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

// ── CSR API helpers ──────────────────────────────────────────────────────────

async function csrFetch(params: Record<string, unknown>): Promise<any> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }
  const url = `${CSR_API_URL}/listings?${searchParams.toString()}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'REPLIERS-API-KEY': CSR_API_KEY,
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) return null
  return res.json()
}

/** Fetch cities for an area (county) via aggregates */
async function fetchAreaCities(area: string): Promise<string[]> {
  const data = await csrFetch({
    boardId: BOARD_ID,
    area,
    status: 'A',
    listings: false,
    aggregates: 'address.city'
  })
  if (!data?.aggregates) return []
  const cityAgg =
    data.aggregates['address.city'] ?? data.aggregates?.address?.city
  if (!cityAgg || typeof cityAgg !== 'object') return []
  return Object.keys(cityAgg).filter(Boolean).sort()
}

/** Build API filter params from a sub-type config */
function buildSubTypeFilters(subType: SubTypeConfig): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  switch (subType.filterType) {
    case 'condo':
      params.class = 'condo'
      break
    case 'rental':
      params.type = 'lease'
      break
    case 'land':
      params.class = 'commercial'
      params.propertyType = 'Land'
      break
    default:
      params.class = 'residential'
  }
  if (subType.propertyType) params.propertyType = subType.propertyType
  if (subType.keywords) params.keywords = subType.keywords
  if (subType.minPrice) params.minPrice = subType.minPrice
  if (subType.lastStatus) params.lastStatus = subType.lastStatus
  if (subType.minLotSize) params.minLotSize = subType.minLotSize
  if (subType.stories)
    params.keywords = subType.stories === 1 ? '1 story' : '2 story'
  return params
}

/** Fetch listing count + price stats for a city with optional extra filters */
async function fetchCityStats(
  city: string,
  extraFilters?: Record<string, unknown>
): Promise<{ count: number; avg: number; med: number }> {
  const data = await csrFetch({
    boardId: BOARD_ID,
    city,
    status: 'A',
    listings: false,
    statistics: 'listPrice',
    resultsPerPage: 1,
    ...extraFilters
  })
  if (!data) return { count: 0, avg: 0, med: 0 }
  return {
    count: data.count ?? 0,
    avg: data.statistics?.listPrice?.avg ?? 0,
    med: data.statistics?.listPrice?.med ?? 0
  }
}

/** Fetch neighborhoods for a city via aggregates */
async function fetchNeighborhoods(city: string): Promise<string[]> {
  const data = await csrFetch({
    boardId: BOARD_ID,
    city,
    status: 'A',
    listings: false,
    aggregates: 'address.neighborhood'
  })
  if (!data?.aggregates) return []
  const hoodAgg =
    data.aggregates['address.neighborhood'] ??
    data.aggregates?.address?.neighborhood
  if (!hoodAgg || typeof hoodAgg !== 'object') return []
  return Object.keys(hoodAgg).filter(Boolean).sort()
}

/** Fetch neighborhood-level stats */
async function fetchNeighborhoodStats(
  city: string,
  neighborhood: string
): Promise<{ count: number; avg: number; med: number }> {
  const data = await csrFetch({
    boardId: BOARD_ID,
    city,
    neighborhood,
    status: 'A',
    listings: false,
    statistics: 'listPrice',
    resultsPerPage: 1
  })
  if (!data) return { count: 0, avg: 0, med: 0 }
  return {
    count: data.count ?? 0,
    avg: data.statistics?.listPrice?.avg ?? 0,
    med: data.statistics?.listPrice?.med ?? 0
  }
}

// ── Slug / URL helpers ───────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getPriceTier(avgPrice: number, tiers: PriceTier[]): string {
  for (const tier of tiers) {
    if (avgPrice >= tier.min && avgPrice < tier.max) return tier.label
  }
  return tiers[tiers.length - 1]?.label ?? ''
}

// ── Cache helpers ────────────────────────────────────────────────────────────

async function readCache(): Promise<PPCFeedCache | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8')
    return JSON.parse(raw) as PPCFeedCache
  } catch {
    return null
  }
}

async function writeCache(entries: PPCPageEntry[]): Promise<void> {
  const cache: PPCFeedCache = { timestamp: new Date().toISOString(), entries }
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true })
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2))
}

function isCacheValid(cache: PPCFeedCache): boolean {
  const age = Date.now() - new Date(cache.timestamp).getTime()
  return age < CACHE_MAX_AGE_MS
}

// ── Core generation logic ────────────────────────────────────────────────────

async function generateFeed(
  minAvgPrice: number,
  minListings: number
): Promise<PPCPageEntry[]> {
  const entries: PPCPageEntry[] = []
  const {
    excludeSubTypes,
    targetAreas,
    priceTiers,
    baseUrl,
    includeSubTypes,
    includeNeighborhoods
  } = ppcFeedConfig

  const eligibleSubTypes = subTypes.filter(
    (st) => !excludeSubTypes.includes(st.slug)
  )

  for (const area of targetAreas) {
    const cities = await fetchAreaCities(area)

    for (const city of cities) {
      const citySlug = slugify(city)

      // ── Sub-type pages ──
      if (includeSubTypes) {
        for (const st of eligibleSubTypes) {
          const filters = buildSubTypeFilters(st)
          const stats = await fetchCityStats(city, filters)

          if (stats.count >= minListings && stats.avg >= minAvgPrice) {
            entries.push({
              url: `${baseUrl}/${citySlug}/${st.slug}`,
              type: 'subType',
              city,
              name: st.label,
              listingCount: stats.count,
              avgPrice: Math.round(stats.avg),
              medianPrice: Math.round(stats.med),
              priceTier: getPriceTier(stats.avg, priceTiers)
            })
          }
        }
      }

      // ── Neighborhood pages ──
      if (includeNeighborhoods) {
        const neighborhoods = await fetchNeighborhoods(city)

        for (const hood of neighborhoods) {
          const stats = await fetchNeighborhoodStats(city, hood)

          if (stats.count >= minListings && stats.avg >= minAvgPrice) {
            entries.push({
              url: `${baseUrl}/${citySlug}/${slugify(hood)}`,
              type: 'neighborhood',
              city,
              name: hood,
              listingCount: stats.count,
              avgPrice: Math.round(stats.avg),
              medianPrice: Math.round(stats.med),
              priceTier: getPriceTier(stats.avg, priceTiers)
            })
          }
        }
      }
    }
  }

  return entries
}

// ── Format converters ────────────────────────────────────────────────────────

function toPageFeedRows(entries: PPCPageEntry[]) {
  return entries.map((e) => ({
    'Page URL': e.url,
    'Custom Label 1': e.type,
    'Custom Label 2': e.city,
    'Custom Label 3': e.name,
    'Custom Label 4': e.priceTier
  }))
}

function toCustomizerRows(entries: PPCPageEntry[]) {
  return entries.map((e) => {
    const priceRange =
      e.avgPrice >= 2000000
        ? '$2M+'
        : e.avgPrice >= 1000000
          ? `$${(e.avgPrice / 1000000).toFixed(1)}M`
          : `$${Math.round(e.avgPrice / 1000)}K`

    return {
      'Page URL': e.url,
      listing_count: e.listingCount,
      avg_price: e.avgPrice,
      median_price: e.medianPrice,
      city: e.city,
      name: e.name,
      price_range: priceRange
    }
  })
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const format = sp.get('format') || 'csv'
    const type = sp.get('type') || 'pages'
    const refresh = sp.get('refresh') === 'true'
    const minAvgPrice = parseInt(
      sp.get('minAvgPrice') || String(ppcFeedConfig.minAvgPrice),
      10
    )
    const minListings = parseInt(
      sp.get('minListings') || String(ppcFeedConfig.minListings),
      10
    )

    // Try cache first (unless refresh requested)
    let entries: PPCPageEntry[] | null = null

    if (!refresh) {
      const cache = await readCache()
      if (cache && isCacheValid(cache)) {
        entries = cache.entries
      }
    }

    // Generate if no valid cache
    if (!entries) {
      entries = await generateFeed(minAvgPrice, minListings)
      await writeCache(entries)
    }

    // Apply runtime filters (if overridden via params beyond the cached defaults)
    const filtered = entries.filter(
      (e) => e.avgPrice >= minAvgPrice && e.listingCount >= minListings
    )

    // Build output rows
    const rows: Record<string, unknown>[] =
      type === 'customizers'
        ? toCustomizerRows(filtered)
        : toPageFeedRows(filtered)

    if (format === 'json') {
      return NextResponse.json({
        data: rows,
        meta: {
          total: rows.length,
          byType: {
            subType: filtered.filter((e) => e.type === 'subType').length,
            neighborhood: filtered.filter((e) => e.type === 'neighborhood')
              .length
          },
          byCity: Object.fromEntries(
            [...new Set(filtered.map((e) => e.city))].map((city) => [
              city,
              filtered.filter((e) => e.city === city).length
            ])
          ),
          byPriceTier: Object.fromEntries(
            ppcFeedConfig.priceTiers.map((t) => [
              t.label,
              filtered.filter((e) => e.priceTier === t.label).length
            ])
          ),
          generated_at: new Date().toISOString(),
          cached: !refresh
        }
      })
    }

    // CSV
    const csv = toCSV(rows)
    const filename =
      type === 'customizers' ? 'ppc-ad-customizers.csv' : 'ppc-page-feed.csv'

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating PPC page feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate PPC page feed', details: String(error) },
      { status: 500 }
    )
  }
}
