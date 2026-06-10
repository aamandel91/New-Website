import type { SubTypeConfig } from '@configs/page-generation'
import searchConfig from '@configs/search'

import type {
  ApiBoardArea,
  ApiBoardCity,
  ApiNeighborhood,
  ApiQueryResponse
} from 'services/API'
import { APISearch } from 'services/API'
import APISearchCSR from 'services/API/APISearchCSR'

const useCSR = !!process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY
const defaultBoardId = useCSR ? 110 : searchConfig.defaultBoardId

/**
 * Data fetching service for the page generation engine.
 * Provides functions to fetch counties, cities, neighborhoods, listing counts,
 * zip codes, and sub-type specific data from the Repliers API.
 */

/**
 * Fetch all cities within a county (area) from the locations API.
 * Areas in Repliers data correspond to counties.
 */
export async function fetchCountyCities(
  county: string
): Promise<ApiBoardCity[]> {
  try {
    const response = await APISearch.fetchLocations()
    if (!response) return []

    const areas = response.boards[0]?.classes[0]?.areas ?? []
    const matchedArea = areas.find(
      (area: ApiBoardArea) => area.name.toLowerCase() === county.toLowerCase()
    )
    return matchedArea?.cities ?? []
  } catch (error) {
    console.error(
      `[pageGeneration] fetchCountyCities error for "${county}"`,
      error
    )
    return []
  }
}

/**
 * Fetch neighborhoods for a city from the locations API.
 */
export async function fetchCityNeighborhoods(
  city: string
): Promise<ApiNeighborhood[]> {
  try {
    const response = await APISearch.fetchLocations()
    if (!response) return []

    for (const board of response.boards) {
      for (const cls of board.classes) {
        for (const area of cls.areas) {
          const found = area.cities.find(
            (c: ApiBoardCity) => c.name.toLowerCase() === city.toLowerCase()
          )
          if (found?.neighborhoods) {
            return found.neighborhoods
          }
        }
      }
    }
    return []
  } catch (error) {
    console.error(
      `[pageGeneration] fetchCityNeighborhoods error for "${city}"`,
      error
    )
    return []
  }
}

/**
 * Build search API query parameters from a sub-type config.
 */
function buildSubTypeFilters(subType: SubTypeConfig): Record<string, unknown> {
  const params: Record<string, unknown> = {}

  // Map filterType to API class
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

  if (subType.propertyType) {
    params.propertyType = subType.propertyType
  }
  if (subType.keywords) {
    params.keywords = subType.keywords
  }
  if (subType.minPrice) {
    params.minPrice = subType.minPrice
  }
  if (subType.lastStatus) {
    params.lastStatus = subType.lastStatus
  }
  if (subType.minLotSize) {
    params.minLotSize = subType.minLotSize
  }
  if (subType.stories) {
    params.keywords = subType.stories === 1 ? '1 story' : '2 story'
  }

  return params
}

/**
 * Fetch listing count for a city with optional filters.
 */
export async function fetchListingCount(
  city: string,
  filters?: Record<string, unknown>
): Promise<number> {
  try {
    if (useCSR) {
      const result = await APISearchCSR.searchListings({
        city,
        status: 'A',
        boardId: defaultBoardId,
        resultsPerPage: 1,
        listings: false,
        ...filters
      } as any)
      return result?.count ?? 0
    }

    const response = await APISearch.fetch(
      {
        get: {
          city,
          status: 'A',
          boardId: defaultBoardId,
          resultsPerPage: 1,
          listings: false,
          ...filters
        },
        post: {}
      },
      undefined
    )
    return response?.count ?? 0
  } catch (error) {
    console.error(
      `[pageGeneration] fetchListingCount error for "${city}"`,
      error
    )
    return 0
  }
}

/**
 * Fetch zip codes associated with a city using the aggregates parameter.
 */
export async function fetchZipCodesForCity(city: string): Promise<string[]> {
  try {
    if (useCSR) {
      const result = await APISearchCSR.searchListings({
        city,
        status: 'A',
        boardId: defaultBoardId,
        resultsPerPage: 1,
        listings: false,
        aggregates: 'address.zip'
      })

      const zipAggregates = result?.aggregates as
        | Record<string, unknown>
        | undefined
      if (!zipAggregates) return []
      const zipData =
        (zipAggregates as any)?.['address.zip'] ??
        (zipAggregates as any)?.address?.zip
      if (!zipData || typeof zipData !== 'object') return []
      return Object.keys(zipData).filter(Boolean).sort()
    }

    const response = await APISearch.fetch(
      {
        get: {
          city,
          status: 'A',
          boardId: defaultBoardId,
          resultsPerPage: 1,
          listings: false,
          aggregates: 'address.zip'
        },
        post: {}
      },
      undefined
    )

    const zipAggregates = response?.aggregates as
      | Record<string, unknown>
      | undefined
    if (!zipAggregates) return []
    const zipData =
      (zipAggregates as any)?.['address.zip'] ??
      (zipAggregates as any)?.address?.zip
    if (!zipData || typeof zipData !== 'object') return []
    return Object.keys(zipData).filter(Boolean).sort()
  } catch (error) {
    console.error(
      `[pageGeneration] fetchZipCodesForCity error for "${city}"`,
      error
    )
    return []
  }
}

/**
 * Fetch the listing count for a specific sub-type in a city.
 */
export async function fetchSubTypeCount(
  city: string,
  subType: SubTypeConfig
): Promise<number> {
  const filters = buildSubTypeFilters(subType)
  return fetchListingCount(city, filters)
}

/**
 * Fetch a small set of listings for a city with optional sub-type filters.
 * Used for preview feeds on generated pages.
 */
export async function fetchListingsPreview(
  city: string,
  limit: number = 12,
  subTypeFilters?: Record<string, unknown>
): Promise<ApiQueryResponse | null> {
  try {
    if (useCSR) {
      return await APISearchCSR.searchListings({
        city,
        status: 'A',
        boardId: defaultBoardId,
        resultsPerPage: limit,
        sortBy: 'createdOnDesc',
        listings: true,
        ...subTypeFilters
      } as any)
    }

    return await APISearch.fetch(
      {
        get: {
          city,
          status: 'A',
          boardId: defaultBoardId,
          resultsPerPage: limit,
          sortBy: 'createdOnDesc',
          listings: true,
          ...subTypeFilters
        },
        post: {}
      },
      undefined
    )
  } catch (error) {
    console.error(
      `[pageGeneration] fetchListingsPreview error for "${city}"`,
      error
    )
    return null
  }
}

export { buildSubTypeFilters }

export interface ListingStats {
  count: number
  avg: number
  med: number
  min: number
  max: number
}

// Cache stats results for 60 seconds to avoid hammering Repliers on every
// generateMetadata call. Keyed by the scope identifier.
const statsCache = new Map<string, { value: ListingStats; expiresAt: number }>()
const STATS_CACHE_TTL_MS = 60 * 1000

/**
 * Fetch active-listing stats (count + price aggregates) for a scope. Always
 * resolves — on failure returns a zeroed object so callers can degrade
 * gracefully (the renderer skips empty placeholders).
 */
export async function fetchListingStats(
  scope: { city?: string; zip?: string; neighborhood?: string },
  filters?: Record<string, unknown>
): Promise<ListingStats> {
  const cacheKey = JSON.stringify({ ...scope, ...(filters || {}) })
  const now = Date.now()
  const hit = statsCache.get(cacheKey)
  if (hit && hit.expiresAt > now) return hit.value

  const params: Record<string, unknown> = {
    status: 'A',
    boardId: defaultBoardId,
    resultsPerPage: 1,
    listings: false,
    statistics:
      'avg-listPrice,med-listPrice,min-listPrice,max-listPrice,cnt-listPrice',
    ...filters
  }
  if (scope.city) params['city'] = scope.city
  if (scope.zip) params['address.zip'] = scope.zip
  if (scope.neighborhood) params['neighborhood'] = scope.neighborhood

  try {
    const response = useCSR
      ? await APISearchCSR.searchListings(params as any)
      : await APISearch.fetch({ get: params, post: {} }, undefined)

    const listPrice = (response as any)?.statistics?.listPrice ?? {}
    const value: ListingStats = {
      count: Number((response as any)?.count ?? 0) || 0,
      avg: Number(listPrice?.avg ?? 0) || 0,
      med: Number(listPrice?.med ?? 0) || 0,
      min: Number(listPrice?.min ?? 0) || 0,
      max: Number(listPrice?.max ?? 0) || 0
    }
    statsCache.set(cacheKey, { value, expiresAt: now + STATS_CACHE_TTL_MS })
    return value
  } catch (error) {
    console.error('[pageGeneration] fetchListingStats error', error)
    return { count: 0, avg: 0, med: 0, min: 0, max: 0 }
  }
}

export function formatPrice(n: number | null | undefined): string {
  if (!n || !isFinite(n) || n <= 0) return ''
  return '$' + Math.round(n).toLocaleString('en-US')
}
