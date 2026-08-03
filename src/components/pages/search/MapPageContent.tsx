'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

import { Skeleton } from '@mui/material'

import { trackSearch } from '@/utils/analytics'
import { ssTrackEvent } from '@/utils/suresendTracking'

import MapService from 'services/Map/Map'
import {
  type Filters,
  getClusterParams,
  getDefaultRectangle,
  getListingFields,
  getMapPolygon,
  getMapPolygons,
  getMapRectangle,
  getPageParams
} from 'services/Search'
import { type MapPosition, useMapOptions } from 'providers/MapOptionsProvider'
import { useSearch } from 'providers/SearchProvider'
import type { LngLat, LngLatBounds } from 'utils/lngLat'
import { type PolygonZone } from 'utils/map'
import {
  decodePolygons,
  encodePolygons,
  getMapUrl,
  isPropertyExcluded,
  polygonToZones
} from 'utils/map'
import { updateWindowHistory } from 'utils/urls'

import MapFilters from './components/MapFilters'

const MapRoot = dynamic(() => import('./components/MapRoot'), {
  ssr: false,
  loading: () => (
    <Skeleton
      variant="rectangular"
      width="100%"
      height="100%"
      sx={{ borderRadius: 1 }}
    />
  )
})

const MapPageContent = () => {
  const searchParams = useSearchParams()
  const [mapLoaded, setMapLoaded] = useState(false)
  const { search, save, filters, polygons, setPolygons } = useSearch()
  const { layout, position, setPosition } = useMapOptions()

  const query = searchParams.get('q')
  const page = searchParams.get('page')

  // ── one-time URL → polygons hydration (handles legacy ?polygon= and new
  // ?polygons= query params). The SearchProvider already accepts these via
  // server-side props, but we also support client-side share/bookmark URLs
  // that arrive after first paint.
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    if (polygons.length) return // already populated from server props

    const polygonsRaw = searchParams.get('polygons')
    if (polygonsRaw) {
      const zones = decodePolygons(polygonsRaw)
      if (zones.length) setPolygons(zones)
      return
    }

    const legacyRaw = searchParams.get('polygon')
    if (legacyRaw) {
      try {
        const coords = JSON.parse(legacyRaw)
        if (Array.isArray(coords) && coords.length) {
          setPolygons(polygonToZones(coords))
        }
      } catch {
        // ignore malformed legacy polygon
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async (
    position: MapPosition,
    filters: Filters,
    polygons: PolygonZone[]
  ) => {
    const { zoom, bounds } = position

    const includeZones = polygons.filter((z) => z.type === 'include')
    const excludeZones = polygons.filter((z) => z.type === 'exclude')

    // Inclusions go to Repliers as the `map` param. With no inclusions,
    // fall back to the visible bounds rectangle.
    const fetchBounds = includeZones.length
      ? getMapPolygons(includeZones.map((z) => z.coords))
      : bounds
        ? getMapRectangle(bounds)
        : getDefaultRectangle()

    // Bump page size when exclusions are present so the visible (post-filter)
    // result count doesn't get too sparse.
    const pageParams = getPageParams(1, excludeZones.length > 0)

    const response = await search({
      ...filters,
      ...fetchBounds,
      ...pageParams,
      ...getListingFields(),
      ...getClusterParams(zoom)
    })

    if (!response) return

    // Apply client-side exclusion filter on the listings (and aggregated
    // counts as a best-effort approximation — the backend `count` reflects
    // pre-exclusion counts).
    if (excludeZones.length) {
      const filteredListings = response.listings.filter((listing) => {
        const lat = listing.map?.latitude
        const lng = listing.map?.longitude
        if (typeof lat !== 'number' || typeof lng !== 'number') return true
        return !isPropertyExcluded(lat, lng, excludeZones)
      })
      const hidden = response.listings.length - filteredListings.length
      ;(response as any).listings = filteredListings
      ;(response as any).count = Math.max(0, (response.count || 0) - hidden)
    }

    const { list, clusters, count } = save(response)

    MapService.update(list, clusters, count)
    trackSearch({ ...filters, resultCount: count })
    ssTrackEvent('search', {
      location: query || '',
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      beds: filters.minBeds,
      propertyType: filters.propertyType
    })
  }

  // Backward-compat: silence unused import linter for getMapPolygon
  void getMapPolygon

  const handleMapLoad = (
    bounds: LngLatBounds,
    center: LngLat,
    zoom: number
  ) => {
    setMapLoaded(true)
    setPosition({ bounds, center, zoom })
  }

  const handleMapMove = (
    bounds: LngLatBounds,
    center: LngLat,
    zoom: number
  ) => {
    setPosition({ bounds, center, zoom })
  }

  const { center, zoom } = position

  useEffect(() => {
    if (!mapLoaded) return
    if (!center || !zoom) return
    fetchData(position, filters, polygons)
  }, [position, filters, polygons])

  const polygonsParam = polygons.length ? encodePolygons(polygons) : null

  const prevParams = useRef(
    JSON.stringify({ center, zoom, filters, polygonsParam })
  )
  const curParams = JSON.stringify({ center, zoom, filters, polygonsParam })
  const shouldReplaceUrl = curParams !== prevParams.current

  // WARN: every `center`|`zoom`|`filters`|polygons change should reset page to 1
  useEffect(() => {
    if (!center || !zoom) return
    if (!shouldReplaceUrl) return
    prevParams.current = curParams
    const url = getMapUrl({
      center,
      zoom,
      layout,
      filters,
      query,
      polygonsParam
    })
    updateWindowHistory(url)
  }, [shouldReplaceUrl])

  // WARN: switching between `grid` and `map` should KEEP the same page number
  // WARN: layout (grid|map) changes should NOT use the router,
  // but rather update the window history URL directly
  useEffect(() => {
    if (!center || !zoom) return
    const url = getMapUrl({
      center,
      zoom,
      layout,
      filters,
      query,
      page,
      polygonsParam
    })
    updateWindowHistory(url)
  }, [layout])

  // First inclusion zone — passed down for legacy single-polygon callers
  // (e.g. the initial map.addPolygon paint). When polygons is empty, this is
  // null.
  const legacyPolygon =
    polygons.find((z) => z.type === 'include')?.coords || null

  return (
    <>
      <MapFilters />
      <MapRoot
        zoom={zoom}
        center={center}
        polygon={legacyPolygon}
        onMove={handleMapMove}
        onLoad={handleMapLoad}
      />
    </>
  )
}

export default MapPageContent
