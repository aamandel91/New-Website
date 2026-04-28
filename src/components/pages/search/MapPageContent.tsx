'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Position } from 'geojson'
import type { LngLat, LngLatBounds } from 'utils/lngLat'

import { Skeleton } from '@mui/material'

import MapService from 'services/Map'
import {
  type Filters,
  getClusterParams,
  getDefaultRectangle,
  getListingFields,
  getMapPolygon,
  getMapRectangle,
  getPageParams
} from 'services/Search'
import { type MapPosition, useMapOptions } from 'providers/MapOptionsProvider'
import { useSearch } from 'providers/SearchProvider'
import { getMapUrl } from 'utils/map'
import { updateWindowHistory } from 'utils/urls'
import { trackSearch } from '@/utils/analytics'
import { ssTrackEvent } from '@/utils/suresendTracking'

import MapFilters from './components/MapFilters'

const MapRoot = dynamic(() => import('./components/MapRoot'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 1 }} />,
})

const MapPageContent = () => {
  const searchParams = useSearchParams()
  const [mapLoaded, setMapLoaded] = useState(false)
  const { search, save, filters, polygon } = useSearch()
  const { layout, position, setPosition } = useMapOptions()

  const query = searchParams.get('q')
  const page = searchParams.get('page')

  const fetchData = async (
    position: MapPosition,
    filters: Filters,
    polygon: Position[] | null
  ) => {
    const { zoom, bounds } = position

    const fetchBounds = polygon
      ? getMapPolygon(polygon)
      : bounds
        ? getMapRectangle(bounds)
        : getDefaultRectangle()

    const response = await search({
      ...filters,
      ...fetchBounds,
      ...getPageParams(),
      ...getListingFields(),
      ...getClusterParams(zoom)
    })

    if (!response) return

    const { list, clusters, count } = save(response)

    MapService.update(list, clusters, count)
    trackSearch({ ...filters, resultCount: count })
    ssTrackEvent('search', {
      location: query || '',
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      beds: filters.minBeds,
      propertyType: filters.propertyType,
    })
  }

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
    fetchData(position, filters, polygon)
  }, [position, filters, polygon])

  const prevParams = useRef(JSON.stringify({ center, zoom, filters }))
  const curParams = JSON.stringify({ center, zoom, filters })
  const shouldReplaceUrl = curParams !== prevParams.current

  // WARN: every `center`|`zoom`|`filters` change should reset the page to 1
  useEffect(() => {
    if (!center || !zoom) return
    if (!shouldReplaceUrl) return
    prevParams.current = curParams
    const url = getMapUrl({ center, zoom, layout, filters, query })
    updateWindowHistory(url)
  }, [shouldReplaceUrl])

  // WARN: switching between `grid` and `map` should KEEP the same page number
  // WARN: layout (grid|map) changes should NOT use the router,
  // but rather update the window history URL directly
  useEffect(() => {
    if (!center || !zoom) return
    const url = getMapUrl({ center, zoom, layout, filters, query, page })
    updateWindowHistory(url)
  }, [layout])

  return (
    <>
      <MapFilters />
      <MapRoot
        zoom={zoom}
        center={center}
        polygon={polygon}
        onMove={handleMapMove}
        onLoad={handleMapLoad}
      />
    </>
  )
}

export default MapPageContent
