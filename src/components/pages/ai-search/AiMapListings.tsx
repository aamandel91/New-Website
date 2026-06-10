'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'

import { Alert, Box, Chip } from '@mui/material'

import mapConfig from '@configs/map'
import { tenant } from '@/configs/tenant.config'

import { APISearchCSR } from 'services/API'
import { getSeoUrl } from 'utils/properties'

import 'mapbox-gl/dist/mapbox-gl.css'

import { trackAiListingClick, trackAiResultsShown } from './utils/analytics'
import { formatMapPrice } from './utils/formatters'
import { filtersToSearchParams } from './utils/nlpParser'
import { AiSearchPanel } from './AiSearchPanel'
import type { AiSearchFilters, AiSearchListing } from './types'

const DEFAULT_CENTER: [number, number] = [-80.1, 26.7] // South Florida
const DEFAULT_ZOOM = 9
const FIELDS = [
  'mlsNumber',
  'listPrice',
  'address.*',
  'details.numBedrooms',
  'details.numBedroomsPlus',
  'details.numBathrooms',
  'details.numBathroomsPlus',
  'details.numGarageSpaces',
  'details.propertyType',
  'images',
  'type',
  'lastStatus',
  'status',
  'map'
].join(',')

function boundsToBbox(bounds: mapboxgl.LngLatBounds) {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return { minLng: sw.lng, minLat: sw.lat, maxLng: ne.lng, maxLat: ne.lat }
}

function getListingCoords(l: AiSearchListing): [number, number] | null {
  const lng = l.map?.longitude ?? l.coordinates?.lng ?? l.longitude
  const lat = l.map?.latitude ?? l.coordinates?.lat ?? l.latitude
  if (
    lng === undefined ||
    lat === undefined ||
    Number.isNaN(lng) ||
    Number.isNaN(lat)
  )
    return null
  return [Number(lng), Number(lat)]
}

function getBubbleColor(
  type?: string,
  status?: string,
  lastStatus?: string
): string {
  if (status === 'U' && (lastStatus === 'Sld' || lastStatus === 'Sc'))
    return '#8b7fa8'
  if (status === 'U') return '#f59e0b'
  if (type === 'Lease') return '#a855f7'
  return tenant.visualIdentity.colors.primary
}

function createPriceBubble(listing: AiSearchListing): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `
    background-color: ${getBubbleColor(listing.type, listing.status, listing.lastStatus)};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    white-space: nowrap;
    pointer-events: auto;
    cursor: pointer;
  `
  el.textContent = formatMapPrice(listing.listPrice || 0, listing.type)
  return el
}

export function AiMapListings() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const fetchSeqRef = useRef(0)

  const [filters, setFilters] = useState<AiSearchFilters>({
    listingType: 'sale',
    propertyTypes: []
  })
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }, [])

  const fetchListings = useCallback(async () => {
    if (!mapRef.current) return
    const map = mapRef.current
    const bounds = map.getBounds()
    if (!bounds) return

    const bbox = boundsToBbox(bounds)
    const params = filtersToSearchParams(filters, bbox)
    params.listings = true
    params.resultsPerPage = 200
    params.fields = FIELDS

    const seq = ++fetchSeqRef.current
    setError(null)
    try {
      const data: any = await APISearchCSR.searchListings(params as any)
      if (seq !== fetchSeqRef.current) return // stale

      const listings: AiSearchListing[] = data?.listings || []
      clearMarkers()

      listings.forEach((listing) => {
        const coords = getListingCoords(listing)
        if (!coords) return
        const bubble = createPriceBubble(listing)
        bubble.addEventListener('click', (e) => {
          e.stopPropagation()
          trackAiListingClick(listing.mlsNumber)
          const url = getSeoUrl(listing as any)
          router.push(url)
        })
        const marker = new mapboxgl.Marker({
          element: bubble,
          anchor: 'bottom',
          offset: [0, -2]
        })
          .setLngLat(coords)
          .addTo(map)
        markersRef.current.push(marker)
      })

      const total = data?.count ?? listings.length
      setCount(total)
      trackAiResultsShown(total, filters)
    } catch (err) {
      if (seq !== fetchSeqRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to load listings')
    }
  }, [filters, clearMarkers, router])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_KEY || ''
    if (!token) {
      setError('Mapbox token is not configured.')
      return
    }
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: mapConfig.mapboxDefaults.minZoom,
      maxZoom: mapConfig.mapboxDefaults.maxZoom,
      attributionControl: false
    })
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    )
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    )

    map.on('load', () => {
      setMapReady(true)
    })
    map.on('moveend', () => {
      fetchListings()
    })

    mapRef.current = map
    return () => {
      clearMarkers()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when filters change or map becomes ready
  useEffect(() => {
    if (mapReady) fetchListings()
  }, [filters, mapReady, fetchListings])

  const handleLocationUpdate = useCallback(
    (loc: { center?: [number, number]; zoom?: number }) => {
      if (!mapRef.current || !loc.center) return
      mapRef.current.easeTo({
        center: loc.center,
        zoom: loc.zoom ?? mapRef.current.getZoom(),
        duration: 800
      })
    },
    []
  )

  return (
    <Box
      sx={{ position: 'relative', width: '100%', height: 'calc(100vh - 70px)' }}
    >
      <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />

      <AiSearchPanel
        filters={filters}
        onFiltersChange={setFilters}
        onLocationUpdate={handleLocationUpdate}
      />

      <Chip
        label={
          error
            ? 'Error loading listings'
            : `${count.toLocaleString()} ${count === 1 ? 'property' : 'properties'}`
        }
        color={error ? 'error' : 'default'}
        sx={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          bgcolor: 'background.paper',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      />

      {error && (
        <Alert
          severity="error"
          sx={{
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 80,
            maxWidth: 500
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    </Box>
  )
}
