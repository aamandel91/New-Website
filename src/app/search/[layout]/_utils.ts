import type { Position } from 'geojson'

import { defaultAdvancedFilters, defaultFilters } from '@configs/filters'

import { type ApiSavedSearch } from 'services/API'
import { type Filters, getListingType } from 'services/Search'
import {
  defaultMaxPrice,
  defaultMinPrice,
  getListingStatus,
  pickFilters
} from 'providers/SaveSearchProvider'
import { calcZoomLevelForBounds, getPositionBounds } from 'utils/map'

import { type SearchParams } from './_types'

export const getPositionFromPolygon = (position: Position[]) => {
  const bounds = getPositionBounds(position)
  const zoom = calcZoomLevelForBounds(bounds, 640, 360)
  const center = bounds.getCenter()
  const { lng, lat } = center

  // convert mapbox's LngLat based classes to plain serializable objects
  // to be able to pass them from server-side component to client-side component
  return {
    zoom,
    center: { lng, lat }
  }
}

export const getFiltersFromSavedSearch = (data: ApiSavedSearch): Filters => {
  const {
    type,
    propertyTypes,
    soldNotifications,
    minPrice, // special treatment for price range values stored in the saved search
    maxPrice, // special treatment for price range values stored in the saved search
    ...restFilters
  } = pickFilters(data)

  const listingType = getListingType(propertyTypes)
  const listingStatus = soldNotifications ? 'all' : getListingStatus(type)

  return {
    ...defaultFilters,
    ...restFilters,
    minPrice: minPrice > defaultMinPrice ? minPrice : 0,
    maxPrice: maxPrice < defaultMaxPrice ? maxPrice : 0,
    listingType,
    listingStatus
  }
}

export const getFiltersFromParams = (searchParams: SearchParams): Filters => {
  const filters: Record<string, any> = Object.fromEntries(
    Object.keys(defaultFilters).map((key) => [
      key,
      searchParams[key as keyof SearchParams] ||
        defaultFilters[key as keyof Filters]
    ])
  )

  Object.keys(defaultAdvancedFilters).forEach((key) => {
    const paramsValue = searchParams[key as keyof SearchParams]
    const defaultsValue = defaultAdvancedFilters[key as keyof Filters]
    if (paramsValue && paramsValue !== defaultsValue) {
      filters[key as keyof Filters] = paramsValue
    }
  })

  // Map hero search params to API-compatible filter fields
  if (searchParams.location) {
    filters['area'] = searchParams.location
  }
  if (searchParams.minPrice) {
    filters['minPrice'] = Number(searchParams.minPrice)
  }
  if (searchParams.maxPrice) {
    filters['maxPrice'] = Number(searchParams.maxPrice)
  }

  // Map advanced search params
  if (searchParams.city) {
    filters['city'] = searchParams.city
  }
  if (searchParams.area) {
    filters['area'] = searchParams.area
  }
  if (searchParams.neighborhood) {
    filters['neighborhood'] = searchParams.neighborhood
  }
  if (searchParams.propertyType) {
    filters['propertyType'] = searchParams.propertyType
  }
  if (searchParams.minBeds) {
    filters['minBeds'] = Number(searchParams.minBeds)
  }
  if (searchParams.maxBeds) {
    filters['maxBeds'] = Number(searchParams.maxBeds)
  }
  if (searchParams.minBaths) {
    filters['minBaths'] = Number(searchParams.minBaths)
  }
  if (searchParams.maxBaths) {
    filters['maxBaths'] = Number(searchParams.maxBaths)
  }
  if (searchParams.minSqft) {
    filters['minSqft'] = Number(searchParams.minSqft)
  }
  if (searchParams.maxSqft) {
    filters['maxSqft'] = Number(searchParams.maxSqft)
  }
  if (searchParams.minYearBuilt) {
    filters['minYearBuilt'] = Number(searchParams.minYearBuilt)
  }
  if (searchParams.maxYearBuilt) {
    filters['maxYearBuilt'] = Number(searchParams.maxYearBuilt)
  }
  if (searchParams.minLotSize) {
    filters['minLotSize'] = Number(searchParams.minLotSize)
  }
  if (searchParams.maxLotSize) {
    filters['maxLotSize'] = Number(searchParams.maxLotSize)
  }
  if (searchParams.amenities) {
    filters['amenities'] = searchParams.amenities
  }
  if (searchParams.keywords) {
    filters['keywords'] = searchParams.keywords
  }
  if (searchParams.sortBy) {
    filters['sortBy'] = searchParams.sortBy
  }

  return filters as Filters
}
