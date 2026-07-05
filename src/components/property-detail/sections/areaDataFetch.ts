/**
 * Server-side data fetching for area/neighborhood sections.
 *
 * These helpers run during server rendering so the demographic, school, and
 * market-stats content is present in the initial HTML (important for SEO).
 * They proxy to the Repliers /places endpoint and to the listings search API
 * for market aggregates.
 *
 * Each function returns `null` on failure so the consuming components can
 * gracefully hide their section. The components are isomorphic — they accept
 * pre-fetched data via props (preferred SSR path) or, when called from
 * deeply nested client trees that lack server data, fetch on the client.
 */

import APISearchCSR from 'services/API/APISearchCSR'

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export interface AreaSchool {
  name: string
  level?: string
  rating?: number
  distance?: string
  distanceKm?: number
  stateRank?: number
}

export interface AreaDemographics {
  population?: number
  medianIncome?: number
  medianAge?: number
  households?: number
  ownerOccupiedPct?: number
}

export interface AreaMarketStats {
  activeCount?: number
  medianPrice?: number
  averagePrice?: number
  averageDaysOnMarket?: number
  saleToListRatio?: number
  trend?: Array<{ month: string; medianPrice: number }>
}

// ---------------------------------------------------------------------------
// Internal: pick the API base. On the server we need an absolute URL; on the
// client a relative path is fine.
// ---------------------------------------------------------------------------

function getApiBase(): string {
  // NEXT_PUBLIC_API_URL is the same env var used by the rest of the API
  // service layer; it's available on both client and server.
  return process.env.NEXT_PUBLIC_API_URL || ''
}

// ---------------------------------------------------------------------------
// Places (schools / parks / transit)
// ---------------------------------------------------------------------------

interface RawPlace {
  name?: string
  level?: string
  type?: string
  grade?: string
  rating?: number | string
  distance?: number | string
  distanceKm?: number
  stateRank?: number
  state_rank?: number
}

interface RawPlacesResponse {
  schools?: RawPlace[]
  [k: string]: unknown
}

function parseNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

function formatDistanceMiles(km?: number): string | undefined {
  if (km === undefined || km === null) return undefined
  const miles = km * 0.621371
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`
  return `${miles.toFixed(1)} mi`
}

export async function fetchAreaSchools(
  lat: number,
  lng: number
): Promise<AreaSchool[] | null> {
  if (!lat || !lng) return null
  try {
    const url = `${getApiBase()}/api/places?lat=${lat}&long=${lng}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = (await res.json()) as RawPlacesResponse
    if (!data?.schools || !Array.isArray(data.schools)) return null

    const schools: AreaSchool[] = data.schools.map((s) => {
      const dist = parseNumber(s.distance ?? s.distanceKm)
      return {
        name: s.name || '',
        level: s.level || s.grade || s.type,
        rating: parseNumber(s.rating),
        distance: formatDistanceMiles(dist),
        distanceKm: dist,
        stateRank: parseNumber(s.stateRank ?? s.state_rank)
      }
    })
    return schools.filter((s) => s.name)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Demographics
// ---------------------------------------------------------------------------
//
// The Repliers /places response sometimes embeds neighborhood-level
// demographic data alongside the schools/parks payload. We probe for the
// fields that are commonly returned and return null when none are present
// so the section can hide gracefully.
//

interface RawDemographicsResponse {
  demographics?: Record<string, unknown>
  population?: number | string
  medianIncome?: number | string
  median_income?: number | string
  medianAge?: number | string
  median_age?: number | string
  households?: number | string
  ownerOccupied?: number | string
  owner_occupied?: number | string
  ownerOccupiedPct?: number | string
  [k: string]: unknown
}

export async function fetchAreaDemographics(
  lat: number,
  lng: number
): Promise<AreaDemographics | null> {
  if (!lat || !lng) return null
  try {
    const url = `${getApiBase()}/api/places?lat=${lat}&long=${lng}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = (await res.json()) as RawDemographicsResponse
    const src = (data.demographics as RawDemographicsResponse) || data

    const demographics: AreaDemographics = {
      population: parseNumber(src.population),
      medianIncome: parseNumber(src.medianIncome ?? src.median_income),
      medianAge: parseNumber(src.medianAge ?? src.median_age),
      households: parseNumber(src.households),
      ownerOccupiedPct: parseNumber(
        src.ownerOccupiedPct ?? src.ownerOccupied ?? src.owner_occupied
      )
    }

    const hasAny = Object.values(demographics).some((v) => v !== undefined)
    return hasAny ? demographics : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Market statistics for a city (derived from listings search aggregates).
// ---------------------------------------------------------------------------

export async function fetchAreaMarketStats(
  city: string
): Promise<AreaMarketStats | null> {
  if (!city) return null
  try {
    const [active, soldHistory] = await Promise.all([
      APISearchCSR.searchListings({
        boardId: 110,
        city,
        status: 'A',
        listings: false,
        resultsPerPage: 1,
        // daysOnMarket stats are only allowed with status U — the sold query
        // below provides avg-daysOnMarket.
        statistics: 'avg-listPrice,med-listPrice'
      } as any).catch(() => null),
      APISearchCSR.searchListings({
        boardId: 110,
        city,
        status: 'U',
        lastStatus: 'Sld',
        listings: false,
        resultsPerPage: 1,
        statistics:
          'grp-mth,med-soldPrice,avg-soldPrice,avg-listPrice,avg-daysOnMarket'
      } as any).catch(() => null)
    ])

    if (!active && !soldHistory) return null

    const stats: AreaMarketStats = {
      activeCount: active?.count ?? undefined,
      averagePrice:
        (active?.statistics as any)?.listPrice?.avg ??
        (soldHistory?.statistics as any)?.soldPrice?.avg ??
        undefined,
      medianPrice:
        (active?.statistics as any)?.listPrice?.med ??
        (soldHistory?.statistics as any)?.soldPrice?.med ??
        undefined,
      averageDaysOnMarket:
        (active?.statistics as any)?.daysOnMarket?.avg ??
        (soldHistory?.statistics as any)?.daysOnMarket?.avg ??
        undefined
    }

    // sale-to-list ratio (sold / list)
    const soldAvg = (soldHistory?.statistics as any)?.soldPrice?.avg
    const listAvg = (soldHistory?.statistics as any)?.listPrice?.avg
    if (soldAvg && listAvg && listAvg > 0) {
      stats.saleToListRatio = (soldAvg / listAvg) * 100
    }

    // 12-month median trend from grp-mth aggregation
    const monthly = (soldHistory?.statistics as any)?.mth
    if (monthly && typeof monthly === 'object') {
      const entries = Object.entries(monthly)
        .map(([month, agg]: [string, any]) => {
          const medianPrice =
            agg?.soldPrice?.med ?? agg?.soldPrice?.avg ?? agg?.med ?? undefined
          return medianPrice
            ? { month, medianPrice: Number(medianPrice) }
            : null
        })
        .filter((x): x is { month: string; medianPrice: number } => Boolean(x))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12)
      if (entries.length >= 2) stats.trend = entries
    }

    const hasAny =
      stats.activeCount !== undefined ||
      stats.medianPrice !== undefined ||
      stats.averagePrice !== undefined ||
      (stats.trend && stats.trend.length > 0)
    return hasAny ? stats : null
  } catch {
    return null
  }
}
