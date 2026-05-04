import type { ListingStatus } from '@configs/filters'

import {
  type ApiClass,
  type ApiQueryParams,
  type ApiSavedSearch,
  type ApiSavedSearchCreateRequest
} from 'services/API'
import {
  flattenFilterArrays,
  mergeFilters,
  transformFilters
} from 'services/Search'
import { type MapPosition } from 'providers/MapOptionsProvider'
import { toRectangle } from 'utils/map'
import { pluralize } from 'utils/strings'

import {
  defaultMaxPrice,
  defaultMinPrice,
  keysToPick,
  places
} from './constants'
import type { CreateSearchParams } from './types'

const removeSubParts = (parts: string[]): string[] => {
  return parts.filter((part, index) => {
    return !parts.some(
      (otherPart, otherIndex) =>
        otherIndex !== index && otherPart.includes(part)
    )
  })
}

const sanitizeNameParts = (location: string) => {
  return removeSubParts([
    ...new Set(location.split(',').map((part: string) => part.trim()))
  ] as string[])
}

export const getAreaName = (
  features: any,
  zoom: number
): string | undefined => {
  const applicableHierarchy =
    places.find((level) => zoom > level.minZoom) || places[places.length - 1]

  for (const placeType of applicableHierarchy.types) {
    const matchingFeature = features.find(
      (feature: any) => feature.place_type[0] === placeType
    )
    if (matchingFeature) {
      // filter out duplicates and subparts
      const nameParts = sanitizeNameParts(matchingFeature.place_name)

      if (zoom >= 16.5) {
        // `text` field contains the same street name as nameParts[0], but without the house number
        return matchingFeature.text + ', ' + nameParts.slice(1, 2).join(', ')
      } else if (zoom > 12 && nameParts.length > 3) {
        // last two parts are usuallly state and country, no need to add them
        return nameParts.slice(0, 2).join(', ')
      }
      return nameParts[0]
    }
  }
}

export const removeFalsyItems = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v))

export const removeNullishItems = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  )

const pickKeys = <T extends Record<string, any>, K extends keyof T>(
  source: T,
  keys: K[]
): Partial<T> => {
  const result: Partial<T> = {}
  keys.forEach((key) => {
    if (key in source) {
      result[key] = source[key]
    }
  })
  return result
}

export const pickFilters = (data: ApiSavedSearch) => {
  return removeFalsyItems(pickKeys(data, keysToPick))
}

export const getSearchClasses = (
  listingType: string | undefined
): ApiClass[] =>
  listingType === 'allListings'
    ? ['condo', 'residential']
    : listingType === 'condo'
      ? ['condo']
      : ['commercial', 'business', 'land'].includes(listingType || '')
        ? ['commercial']
        : ['residential']

export const getListingStatus = (searchType: string): ListingStatus =>
  searchType === 'lease' ? 'rent' : 'active'

export const getRadius = (position: MapPosition) => {
  const { bounds, center } = position
  if (!bounds || !center) return 0
  const ne = bounds.getNorthEast()
  const radius = center.distanceTo(ne) / 1000
  return radius
}

export const getRadiusImperial = (position: MapPosition) => {
  const radius = getRadius(position) * 0.621371
  return pluralize(Number(radius.toFixed(radius >= 5 ? 0 : 1)), {
    one: '$ mile',
    many: '$ miles'
  })
}

export const getRadiusDecimal = (position: MapPosition) => {
  const radius = getRadius(position)
  if (radius >= 0.95) return Number(radius.toFixed(radius >= 5 ? 0 : 1)) + ' km'
  else return Math.round(radius * 10) * 100 + ' meters'
}

export const prepareParams = (params: CreateSearchParams, clientId: number) => {
  const {
    filters,
    polygon,
    polygons,
    bounds,
    name,
    notificationFrequency
  } = params

  const {
    listingType,
    listingStatus,
    minBeds,
    minBaths,
    minGarageSpaces,
    minParkingSpaces
  } = filters || {}

  let { minPrice, maxPrice } = filters || {}
  minPrice ||= defaultMinPrice
  maxPrice ||= defaultMaxPrice

  // SaveSearch specific parameters which differ from Search filters

  // Repliers' saved-search backend uses inclusions only for notification
  // matching — exclusions are filtered client-side at view time. We persist
  // the full polygon set in `excludePolygons` (custom field on the saved
  // search payload) so the frontend can re-apply exclusions on viewing.
  const includeZones = (polygons || []).filter((z) => z.type === 'include')
  const excludeZones = (polygons || []).filter((z) => z.type === 'exclude')

  let map: any[]
  if (includeZones.length) {
    map = includeZones.map((z) => z.coords)
  } else if (polygon) {
    // legacy single-polygon caller
    map = [polygon]
  } else {
    map = JSON.parse(toRectangle(bounds!))
  }

  const type = listingStatus === 'rent' ? 'lease' : 'sale'
  const soldNotifications = ['all', 'sold'].includes(listingStatus || '')
  // group 7 `listingType`s into 3 `classes`
  const searchClasses = getSearchClasses(listingType)

  // transform `listingType` into `propertyTypes` suitable for API
  const transformed = transformFilters(['listingType'], {
    listingType
  } as Partial<ApiQueryParams>) // hackery-fuckery
  const merged = mergeFilters(transformed)
  const processedFilters = flattenFilterArrays(merged)

  return removeFalsyItems({
    map,
    excludePolygons: excludeZones.length
      ? excludeZones.map((z) => z.coords)
      : undefined,
    name,
    type,
    class: searchClasses,
    clientId,
    minBeds,
    minBaths,
    minPrice,
    maxPrice,
    propertyTypes: processedFilters.propertyType || [],
    minGarageSpaces,
    minParkingSpaces,
    soldNotifications,
    notificationFrequency
  }) as ApiSavedSearchCreateRequest
}
