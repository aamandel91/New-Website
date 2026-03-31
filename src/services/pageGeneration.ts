import queryString from 'query-string'

import searchConfig from '@configs/search'

import type { SubTypeConfig } from '@configs/page-generation'
import type {
  ApiBoardArea,
  ApiBoardCity,
  ApiNeighborhood,
  ApiQueryResponse,
} from 'services/API'
import { APISearch } from 'services/API'

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
      (area: ApiBoardArea) =>
        area.name.toLowerCase() === county.toLowerCase()
    )
    return matchedArea?.cities ?? []
  } catch (error) {
    console.error(`[pageGeneration] fetchCountyCities error for "${county}"`, error)
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
            (c: ApiBoardCity) =>
              c.name.toLowerCase() === city.toLowerCase()
          )
          if (found?.neighborhoods) {
            return found.neighborhoods
          }
        }
      }
    }
    return []
  } catch (error) {
    console.error(`[pageGeneration] fetchCityNeighborhoods error for "${city}"`, error)
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
    // lot.size is in sq ft in the API
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
    const getParams: Record<string, unknown> = {
      city,
      status: 'A',
      boardId: searchConfig.defaultBoardId,
      resultsPerPage: 1,
      listings: false,
      ...filters,
    }

    const getParamsString = queryString.stringify(
      getParams as Record<string, string>,
      { arrayFormat: 'none', skipEmptyString: true, skipNull: true }
    )

    const response = await APISearch.fetch(
      { get: getParams, post: {} },
      undefined
    )
    return response?.count ?? 0
  } catch (error) {
    console.error(`[pageGeneration] fetchListingCount error for "${city}"`, error)
    return 0
  }
}

/**
 * Fetch zip codes associated with a city using the aggregates parameter.
 */
export async function fetchZipCodesForCity(
  city: string
): Promise<string[]> {
  try {
    const getParams: Record<string, unknown> = {
      city,
      status: 'A',
      boardId: searchConfig.defaultBoardId,
      resultsPerPage: 1,
      listings: false,
      aggregates: 'address.zip',
    }

    const response = await APISearch.fetch(
      { get: getParams, post: {} },
      undefined
    )

    // The aggregates response for address.zip returns an object keyed by zip code
    const zipAggregates = (response?.aggregates as Record<string, unknown> | undefined)
    if (!zipAggregates) return []

    // Handle the nested structure: aggregates.address.zip or aggregates['address.zip']
    const zipData = (zipAggregates as any)?.['address.zip'] ?? (zipAggregates as any)?.address?.zip
    if (!zipData || typeof zipData !== 'object') return []

    return Object.keys(zipData).filter(Boolean).sort()
  } catch (error) {
    console.error(`[pageGeneration] fetchZipCodesForCity error for "${city}"`, error)
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
    const getParams: Record<string, unknown> = {
      city,
      status: 'A',
      boardId: searchConfig.defaultBoardId,
      resultsPerPage: limit,
      sortBy: 'createdOnDesc',
      listings: true,
      ...subTypeFilters,
    }

    return await APISearch.fetch(
      { get: getParams, post: {} },
      undefined
    )
  } catch (error) {
    console.error(`[pageGeneration] fetchListingsPreview error for "${city}"`, error)
    return null
  }
}

export { buildSubTypeFilters }
