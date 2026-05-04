import type { Position } from 'geojson'
import { type LngLatBounds } from 'utils/lngLat'

import {
  defaultAdvancedFilters,
  defaultFilters,
  listingFields
} from '@configs/filters'
import searchConfig from '@configs/search'

import { nonDefaultFilter } from 'utils/filters'
import { getDefaultBounds, toRectangle } from 'utils/map'

import type { Filters } from './types'

const { clusterLimit, resultsPerPage } = searchConfig

export const getListingFields = () => ({
  listings: true,
  fields: listingFields.join(',')
})

export const getClusterParams = (zoom: number) => ({
  aggregates: 'map',
  clusterLimit,
  clusterPrecision: Math.round(zoom) + 2
})

export const getMapRectangle = (bounds: LngLatBounds) => ({
  map: toRectangle(bounds)
})

export const getDefaultRectangle = () => ({
  map: toRectangle(getDefaultBounds())
})

export const getMapPolygon = (polygon: Position[]) => ({
  map: '[[' + polygon.map((p) => '[' + p.join(',') + ']').join(',') + ']]'
})

// Repliers' `map` param accepts an array of polygons (logical OR — listing
// matches if it's inside any). Each polygon is a coordinate ring.
export const getMapPolygons = (polygons: Position[][]) => {
  if (!polygons.length) return getDefaultRectangle()
  const rings = polygons.map(
    (poly) => '[' + poly.map((p) => '[' + p.join(',') + ']').join(',') + ']'
  )
  return { map: '[' + rings.join(',') + ']' }
}

// pageNum: 1-based page index. bumpForExclusions: when client-side exclusion
// filtering is active, request more listings per page so the post-filter
// result count stays reasonable. Threshold 50 mirrors the spec.
export const getPageParams = (
  pageNum: number = 1,
  bumpForExclusions = false
) => ({
  pageNum,
  resultsPerPage:
    bumpForExclusions && resultsPerPage < 50 ? 60 : resultsPerPage
})

export const getNonDefaultFilters = (
  filters: Filters,
  defaults: Filters = { ...defaultAdvancedFilters, ...defaultFilters }
): Filters =>
  Object.fromEntries(
    Object.entries(filters).filter((entry) => {
      return nonDefaultFilter(entry, defaults)
    })
  ) as Filters
