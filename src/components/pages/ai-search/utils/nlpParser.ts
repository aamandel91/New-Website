import type { AiSearchFilters } from '../types'

/**
 * The backend `/api/listings/nlp` route rewrites Repliers' response so the URL
 * query string is exposed as `request.params` instead of `request.url`. We
 * map those params into our local filter shape.
 */
export function parseNlpParams(params: Record<string, any> | undefined): Partial<AiSearchFilters> {
  if (!params) return {}
  const out: Partial<AiSearchFilters> = {}

  const propertyType = params.propertyType
  if (propertyType) {
    out.propertyTypes = String(propertyType).split(',').map((t) => t.trim()).filter(Boolean)
  }

  const minBeds = params.minBeds ?? params.minBedrooms
  if (minBeds !== undefined) {
    const n = parseInt(String(minBeds), 10)
    if (!Number.isNaN(n)) out.minBedrooms = n
  }

  const minBaths = params.minBaths ?? params.minBathrooms
  if (minBaths !== undefined) {
    const n = parseInt(String(minBaths), 10)
    if (!Number.isNaN(n)) out.minBathrooms = n
  }

  if (params.minPrice !== undefined) {
    const n = parseInt(String(params.minPrice), 10)
    if (!Number.isNaN(n)) out.minPrice = n
  }
  if (params.maxPrice !== undefined) {
    const n = parseInt(String(params.maxPrice), 10)
    if (!Number.isNaN(n)) out.maxPrice = n
  }

  if (params.minSqft !== undefined) {
    const n = parseInt(String(params.minSqft), 10)
    if (!Number.isNaN(n)) out.minSqft = n
  }
  if (params.maxSqft !== undefined) {
    const n = parseInt(String(params.maxSqft), 10)
    if (!Number.isNaN(n)) out.maxSqft = n
  }

  const type = params.type
  if (type === 'sale' || type === 'Sale') out.listingType = 'sale'
  else if (type === 'lease' || type === 'Lease') out.listingType = 'lease'

  if (params.city) out.city = String(params.city)
  if (params.neighborhood) out.neighborhood = String(params.neighborhood)

  return out
}

/**
 * Build CSR listing-search params from local filter state plus a map bounding
 * box. Returns a flat record consumable by `APIClientSide.fetch` /
 * `APISearchCSR.searchListings` (the underlying client allow-list rejects raw
 * `map` polygon params, so we use the supported min/max lat-long bbox).
 */
export function filtersToSearchParams(
  filters: AiSearchFilters,
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    minLatitude: bbox.minLat,
    maxLatitude: bbox.maxLat,
    minLongitude: bbox.minLng,
    maxLongitude: bbox.maxLng,
    status: 'A',
    type: filters.listingType === 'lease' ? 'Lease' : 'Sale',
  }

  if (filters.propertyTypes.length > 0) {
    params.propertyType = filters.propertyTypes.join(',')
  }
  if (filters.minPrice) params.minPrice = filters.minPrice
  if (filters.maxPrice) params.maxPrice = filters.maxPrice
  if (filters.minBedrooms) params.minBedrooms = filters.minBedrooms
  if (filters.minBathrooms) params.minBathrooms = filters.minBathrooms
  if (filters.minSqft) params.minSqft = filters.minSqft
  if (filters.maxSqft) params.maxSqft = filters.maxSqft
  if (filters.city) params.city = filters.city
  if (filters.neighborhood) params.neighborhood = filters.neighborhood

  return params
}
