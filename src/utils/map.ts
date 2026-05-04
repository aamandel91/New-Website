import { type Feature, type Point, type Position } from 'geojson'
import { type Map as MapboxMap } from 'mapbox-gl'
import queryString from 'query-string'

// POJO shims that don't pull in the mapbox-gl runtime bundle (~700KB).
// Use these for everything except code paths that actually render a map.
import { LngLat, LngLatBounds } from 'utils/lngLat'

// Re-export so existing call sites that import `LngLat`/`LngLatBounds` from
// 'utils/map' continue to work without changes.
export { LngLat, LngLatBounds } from 'utils/lngLat'

import { alpha, lighten } from '@mui/material'

import apiConfig from '@configs/api'
import { error, info, secondary, success } from '@configs/colors'
import mapConfig, { type MapStyle } from '@configs/map'
import paramsConfig from '@configs/params'
import routes from '@configs/routes'

import { type ApiBounds, type ApiCoords, type Property } from 'services/API'
import { type Filters, getNonDefaultFilters } from 'services/Search'
import { toSafeNumber } from 'utils/formatters'
import { getMakiSymbol } from 'utils/properties'

type Polygon = Array<{ lat: number; lng: number }>

const { defaultAddressZoom, defaultPolygon, mapboxDefaults, mapStyles } =
  mapConfig

/**
 * @description Function to convert custom polygon object from '@configs/map' module to mapbox bounds
 */
export const getPolygonBounds = (polygon: Polygon) => {
  const { tl, br } = polygon.reduce(
    (acc: any, point: any) => {
      acc.tl.lat = Math.max(acc.tl.lat, point.lat)
      acc.tl.lng = Math.min(acc.tl.lng, point.lng)
      acc.br.lat = Math.min(acc.br.lat, point.lat)
      acc.br.lng = Math.max(acc.br.lng, point.lng)
      return acc
    },
    {
      tl: { lat: -Infinity, lng: Infinity },
      br: { lat: Infinity, lng: -Infinity }
    }
  )

  return new LngLatBounds(tl, br)
}

export const getPositionBounds = (position: Position[]) => {
  return getPolygonBounds(position.map(([lng, lat]) => ({ lng, lat })))
}

export const getDefaultBounds = () => {
  return getPolygonBounds(defaultPolygon)
}

export const getZoom = (searchParams: URLSearchParams) =>
  toSafeNumber(searchParams.get(paramsConfig.zoom)) || mapboxDefaults.zoom!

export const getCoords = (searchParams: URLSearchParams) => {
  const firstParam = searchParams.keys().next().value || ''
  const matches = firstParam.match(/([-0-9.]+),([-0-9.]+)/)
  const [, lat, lng] = matches || [0, 0, 0]

  if (!lat || !lng) return null

  return new LngLat(toSafeNumber(lng), toSafeNumber(lat))
}

export const roundCoord = (coord: number | string) => Number(coord).toFixed(6)

export const formatCoords = (lngLat: LngLat) => {
  const { lat, lng } = lngLat
  return `${roundCoord(lat)},${roundCoord(lng)}`
}

// Convert Mapbox zoom level to Google Maps zoom level
// Mapbox tends to show more detail at the same zoom level
export const toGoogleZoom = (mapboxZoom: number): number => {
  // Approximate conversion: Google zoom is typically 1-2 levels higher
  // This is based on empirical testing and may need fine-tuning
  const googleZoom = Math.round(mapboxZoom + 1.25)
  // Clamp to Google Maps valid range (0-21)
  return Math.max(0, Math.min(21, googleZoom))
}

export const getMapStyleUrl = (style: MapStyle) =>
  `mapbox://styles/mapbox/${mapStyles[style]}`

export const getMapboxStaticStyleUrl = (style: MapStyle) =>
  `https://api.mapbox.com/styles/v1/mapbox/${mapStyles[style]}/static`

export const getMapboxStaticMarker = (
  longitude: string | number,
  latitude: string | number,
  symbol = 'home'
) => {
  const markerSize = 'l'
  const markerColor = secondary.replace('#', '')
  return `pin-${markerSize}-${symbol}+${markerColor}(${longitude},${latitude})`
}

export const getGmapsStaticMarker = (
  longitude: string | number,
  latitude: string | number,
  symbol = 'home'
) => {
  // Google Maps only supports A-Z, 0-9 in labels
  // For house/home properties, use 'H' as a simple home indicator
  const label = symbol.charAt(0).toUpperCase()

  const markerColor = secondary.replace('#', '')
  return `markers=color:0x${markerColor}%7Clabel:${label}%7C${latitude},${longitude}`
}

// const getGmapsSymbol = (property: Property) => {
//   const maki = getMakiSymbol(property)
//   return maki === 'home' ? 'H' : maki.charAt(0).toUpperCase()
// }

type StaticImageUrlParams = {
  point: ApiCoords
  property: Property
  width?: number
  height?: number
  zoom?: number
}

export const getMapboxStaticImageUrl = ({
  point,
  property,
  width = 560,
  height = 200,
  zoom = defaultAddressZoom
}: StaticImageUrlParams): string => {
  const { longitude, latitude } = point
  const imageSize = `${width}x${height}@2x`

  const symbol = getMakiSymbol(property)
  const marker = getMapboxStaticMarker(longitude, latitude, symbol)
  const staticStyleUrl = getMapboxStaticStyleUrl('hybrid')
  const staticImageUrl = `${staticStyleUrl}/${marker}/${longitude},${latitude},${zoom}/${imageSize}?access_token=${mapConfig.mapboxDefaults.accessToken}`

  return staticImageUrl
}

export const getGmapsStaticImageUrl = ({
  point,
  width = 560,
  height = 200,
  zoom = defaultAddressZoom
}: StaticImageUrlParams): string => {
  const { longitude, latitude } = point

  // WARN: google maps static API requires minimum aspect ratio of 16:10
  // if width is greater than 640px (and scale == 2)
  const minAspectRatio = 0.465625 // 16:10 aspect ratio
  if (width > 640 && height / width < minAspectRatio) {
    // eslint-disable-next-line no-param-reassign
    height = Math.round(width * minAspectRatio)
  }

  const size = `${width}x${height}`

  const symbol = '' // getGmapsSymbol(property)

  const marker = getGmapsStaticMarker(longitude, latitude, symbol)
  const params = queryString.stringify({
    size,
    scale: 2, // equivalent to @2x in Mapbox
    zoom: toGoogleZoom(zoom),
    maptype: 'hybrid',
    format: 'jpg',
    key: apiConfig.gmapsApiKey
  })
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  const staticImageUrl = `${baseUrl}?${marker}&${params}`

  return staticImageUrl
}

export const getMapUrl = ({
  center,
  zoom,
  layout = 'map',
  filters,
  query,
  page,
  polygonsParam
}: {
  center: LngLat
  zoom: number
  layout?: 'map' | 'grid' | 'table' | 'gallery'
  filters?: Filters
  // synthetic query params used by page but not the API
  query?: string | null
  page?: number | string | null
  // Encoded polygons (multi-zone) JSON string, included when non-empty.
  polygonsParam?: string | null
}) => {
  const base = `${routes[layout]}?${formatCoords(center)}&z=${String(zoom).slice(0, 8)}`
  const nonEmptyFilters = getNonDefaultFilters(filters || {})

  const params = queryString.stringify(
    {
      ...nonEmptyFilters,
      page: Number(page) > 1 ? Number(page) : null,
      q: query,
      polygons: polygonsParam || null
    },
    {
      arrayFormat: 'none',
      skipEmptyString: true,
      skipNull: true
    }
  )

  return params ? `${base}&${params}` : base
}

export const getGoogleMapUrl = ({
  center,
  zoom = 15
}: {
  center: LngLat
  zoom?: number
}) => {
  const params = queryString.stringify({
    api: 1,
    query: formatCoords(center),
    zoom
  })
  return `https://www.google.com/maps/search/?${params}`
}

export const getMarkerName = (mlsNumber: string) => `marker-${mlsNumber}`

export const toMapboxPoint = (location: ApiCoords) => {
  const { latitude, longitude } = location
  return new LngLat(longitude, latitude)
}

export const toApiPoint = (point: Point): ApiCoords => {
  const [longitude, latitude] = point.coordinates
  return { longitude, latitude }
}

export const toMapboxBounds = (bounds: ApiBounds, buffer = 0) => {
  const { top_left, bottom_right } = bounds

  return new LngLatBounds(
    // converting mixed top_left coords to northeast (mapbox._NE)
    [top_left.longitude - buffer, bottom_right.latitude + buffer],
    // and mixed bottom_right to southwest (mapbox._SW)
    [bottom_right.longitude + buffer, top_left.latitude - buffer]
  )
}

export const toApiBounds = (bounds: LngLatBounds): ApiBounds => {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  return {
    top_left: { latitude: ne.lat, longitude: sw.lng },
    bottom_right: { latitude: sw.lat, longitude: ne.lng }
  }
}

export const toRectangle = (bounds: LngLatBounds, buffer = 0) => {
  /*
    map = [ ↗ NorthEast, ↖ NorthWest, ↙ SouthWest, ↘ SouthEast]
  */
  const ne = bounds.getNorthEast()
  const nw = bounds.getNorthWest()
  const sw = bounds.getSouthWest()
  const se = bounds.getSouthEast()

  // TODO: looks like buffer paddings are not set correctly
  const rectangle = [
    `[${ne.lng + buffer},${ne.lat + buffer}]`, // ↗
    `[${nw.lng - buffer},${nw.lat + buffer}]`, // ↖
    `[${sw.lng - buffer},${sw.lat - buffer}]`, // ↙
    `[${se.lng + buffer},${se.lat - buffer}]` //  ↘
  ]

  return `[[${rectangle.join(',')}]]`
}

export const getCenter = (bounds: ApiBounds) => {
  const { top_left, bottom_right } = bounds

  return new LngLat(
    (top_left.longitude + bottom_right.longitude) / 2,
    (top_left.latitude + bottom_right.latitude) / 2
  )
}

export const getLngLatCenter = (bounds: LngLatBounds) =>
  getCenter(toApiBounds(bounds))

export const calcZoomLevel = (
  map: MapboxMap,
  apiBounds: ApiBounds
): number => {
  const bounds = toMapboxBounds(apiBounds)
  const viewportWidth = map.getContainer().clientWidth
  const viewportHeight = map.getContainer().clientHeight

  const maxZoom = map.getMaxZoom()
  const minZoom = map.getMinZoom()

  const northeast = map.project(bounds.getNorthEast())
  const southwest = map.project(bounds.getSouthWest())

  const width = Math.abs(northeast.x - southwest.x)
  const height = Math.abs(southwest.y - northeast.y)

  const scaleWidth = viewportWidth / width
  const scaleHeight = viewportHeight / height
  const scale = Math.min(scaleWidth, scaleHeight)
  const zoom = Math.log2(scale) + map.getZoom()

  return Math.max(minZoom, Math.min(maxZoom, zoom))
}

export const calcZoomLevelForBounds = (
  bounds: LngLatBounds,
  width: number,
  height: number
) => {
  const dx = Math.abs(bounds.getEast() - bounds.getWest()) // longitude
  const dy = Math.abs(bounds.getSouth() - bounds.getNorth()) // latitude

  const zoomWidth = Math.log2((width * 180) / (dx * 256))
  const zoomHeight = Math.log2((height * 180) / (dy * 256))
  return Math.min(zoomWidth, zoomHeight)
}

export const calcBoundsAtZoom = (
  map: MapboxMap,
  location: ApiCoords,
  zoom: number
): ApiBounds => {
  const EARTH_RADIUS = 6378137 // in meters
  const mapWidth = map.getContainer().clientWidth
  const mapHeight = map.getContainer().clientHeight

  const zoomPow = 2 ** (zoom + 1)

  const metersPerPixel =
    (2 *
      Math.PI *
      EARTH_RADIUS *
      Math.cos((location.latitude * Math.PI) / 180)) /
    (256 * zoomPow)

  const widthInMeters = mapWidth * metersPerPixel
  const heightInMeters = mapHeight * metersPerPixel

  const latDiff = (heightInMeters / EARTH_RADIUS) * (180 / Math.PI)
  const lngDiff =
    ((widthInMeters / EARTH_RADIUS) * (180 / Math.PI)) /
    Math.cos((location.latitude * Math.PI) / 180)

  const swLng = location.longitude - lngDiff / 2
  const swLat = location.latitude - latDiff / 2
  const neLng = location.longitude + lngDiff / 2
  const neLat = location.latitude + latDiff / 2

  const sw = new LngLat(swLng, swLat)
  const ne = new LngLat(neLng, neLat)

  return toApiBounds(new LngLatBounds(sw, ne))
}

export const removePolygon = (map: MapboxMap) => {
  try {
    map.removeLayer('polygon-fill')
    map.removeLayer('polygon-outline')
    map.removeSource('polygon')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // TODO: not sure we need to handle this error. Mapbox cant control its own sources
  }
}

export const addPolygon = (map: MapboxMap, polygon: Position[]) => {
  if (polygon) {
    const polygonGeoJSON: Feature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polygon]
      },
      properties: {}
    }

    map.addSource('polygon', {
      type: 'geojson',
      data: polygonGeoJSON
    })

    map.addLayer({
      id: 'polygon-fill',
      type: 'fill',
      source: 'polygon',
      paint: {
        'fill-color': info,
        'fill-opacity': 0.25
      }
    })

    map.addLayer({
      id: 'polygon-outline',
      type: 'line',
      source: 'polygon',
      paint: {
        'line-color': lighten(info, 0.2),
        'line-width': 1.5
      }
    })
  }
}

// ─── multi-polygon helpers ──────────────────────────────────────────────

export type PolygonZoneType = 'include' | 'exclude'

export type PolygonZone = {
  coords: Position[]
  type: PolygonZoneType
}

export const includeColor = success
export const excludeColor = error

// Standard ray-casting point-in-polygon (even-odd rule).
// Polygon coords are [lng, lat] pairs. Works for self-intersecting shapes.
export const pointInPolygon = (
  lng: number,
  lat: number,
  polygon: Position[]
): boolean => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi || Number.MIN_VALUE) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export const isPropertyExcluded = (
  lat: number,
  lng: number,
  excludeZones: PolygonZone[]
): boolean => {
  for (const zone of excludeZones) {
    if (pointInPolygon(lng, lat, zone.coords)) return true
  }
  return false
}

const ZONES_SOURCE_ID = 'polygon-zones'
const ZONES_INCLUDE_FILL = 'polygon-zones-include-fill'
const ZONES_INCLUDE_LINE = 'polygon-zones-include-line'
const ZONES_EXCLUDE_FILL = 'polygon-zones-exclude-fill'
const ZONES_EXCLUDE_LINE = 'polygon-zones-exclude-line'
const ZONES_LABELS = 'polygon-zones-labels'
const ZONES_HIGHLIGHT = 'polygon-zones-highlight'

const polygonCentroid = (coords: Position[]): Position => {
  let sx = 0
  let sy = 0
  for (const [x, y] of coords) {
    sx += x
    sy += y
  }
  const n = coords.length || 1
  return [sx / n, sy / n]
}

export const removeZonesLayers = (map: MapboxMap) => {
  for (const id of [
    ZONES_INCLUDE_FILL,
    ZONES_INCLUDE_LINE,
    ZONES_EXCLUDE_FILL,
    ZONES_EXCLUDE_LINE,
    ZONES_LABELS,
    ZONES_HIGHLIGHT
  ]) {
    try {
      if (map.getLayer(id)) map.removeLayer(id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      // ignore
    }
  }
  try {
    if (map.getSource(ZONES_SOURCE_ID)) map.removeSource(ZONES_SOURCE_ID)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    // ignore
  }
}

export const renderZones = (
  map: MapboxMap,
  zones: PolygonZone[],
  highlightIndex: number | null = null
) => {
  removeZonesLayers(map)
  if (!zones.length) return

  const features: Feature[] = zones.map((z, idx) => {
    const ring =
      z.coords.length &&
      (z.coords[0][0] !== z.coords[z.coords.length - 1][0] ||
        z.coords[0][1] !== z.coords[z.coords.length - 1][1])
        ? [...z.coords, z.coords[0]]
        : z.coords
    const centroid = polygonCentroid(z.coords)
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        zoneType: z.type,
        index: idx,
        label: String(idx + 1),
        centroidLng: centroid[0],
        centroidLat: centroid[1]
      }
    }
  })

  map.addSource(ZONES_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  })

  map.addLayer({
    id: ZONES_INCLUDE_FILL,
    type: 'fill',
    source: ZONES_SOURCE_ID,
    filter: ['==', ['get', 'zoneType'], 'include'],
    paint: {
      'fill-color': includeColor,
      'fill-opacity': 0.2
    }
  })

  map.addLayer({
    id: ZONES_INCLUDE_LINE,
    type: 'line',
    source: ZONES_SOURCE_ID,
    filter: ['==', ['get', 'zoneType'], 'include'],
    paint: {
      'line-color': alpha(includeColor, 0.7),
      'line-width': 2
    }
  })

  map.addLayer({
    id: ZONES_EXCLUDE_FILL,
    type: 'fill',
    source: ZONES_SOURCE_ID,
    filter: ['==', ['get', 'zoneType'], 'exclude'],
    paint: {
      'fill-color': excludeColor,
      'fill-opacity': 0.2
    }
  })

  map.addLayer({
    id: ZONES_EXCLUDE_LINE,
    type: 'line',
    source: ZONES_SOURCE_ID,
    filter: ['==', ['get', 'zoneType'], 'exclude'],
    paint: {
      'line-color': alpha(excludeColor, 0.7),
      'line-width': 2
    }
  })

  // Numeric labels at polygon centroid
  const labelFeatures: Feature[] = zones.map((z, idx) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: polygonCentroid(z.coords) },
    properties: {
      label: String(idx + 1),
      zoneType: z.type
    }
  }))

  // Re-add as a separate source for labels (single FeatureCollection with point centroids)
  // We piggyback on the same source by using a symbol layer with a centroid expression.
  map.addLayer({
    id: ZONES_LABELS,
    type: 'symbol',
    source: ZONES_SOURCE_ID,
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 14,
      'text-allow-overlap': true,
      'symbol-placement': 'point'
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': [
        'case',
        ['==', ['get', 'zoneType'], 'exclude'],
        excludeColor,
        includeColor
      ],
      'text-halo-width': 2
    }
  })

  if (
    highlightIndex !== null &&
    highlightIndex >= 0 &&
    highlightIndex < zones.length
  ) {
    map.addLayer({
      id: ZONES_HIGHLIGHT,
      type: 'line',
      source: ZONES_SOURCE_ID,
      filter: ['==', ['get', 'index'], highlightIndex],
      paint: {
        'line-color': '#000000',
        'line-width': 4,
        'line-opacity': 0.6
      }
    })
  }

  // unused features array (kept above for label feature derivation)
  void labelFeatures
}

// ─── URL serialization for polygons ─────────────────────────────────────

export const encodePolygons = (zones: PolygonZone[]): string => {
  // Compact form: array of [type, [[lng,lat], ...]]
  const compact = zones.map((z) => [z.type === 'exclude' ? 'x' : 'i', z.coords])
  return JSON.stringify(compact)
}

export const decodePolygons = (raw: string | null | undefined): PolygonZone[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const zones: PolygonZone[] = []
    for (const item of parsed) {
      // New compact form: ['i' | 'x', coords]
      if (Array.isArray(item) && item.length === 2 && Array.isArray(item[1])) {
        const [t, coords] = item
        const type: PolygonZoneType =
          t === 'x' || t === 'exclude' ? 'exclude' : 'include'
        zones.push({ type, coords: coords as Position[] })
        continue
      }
      // Object form: { type, coords }
      if (item && typeof item === 'object' && Array.isArray(item.coords)) {
        const type: PolygonZoneType =
          item.type === 'exclude' ? 'exclude' : 'include'
        zones.push({ type, coords: item.coords as Position[] })
      }
    }
    return zones
  } catch {
    return []
  }
}

// Backward-compat: convert a legacy single-polygon coord array to a single
// inclusion zone. Returns [] if input is empty or invalid.
export const polygonToZones = (
  polygon: Position[] | null | undefined
): PolygonZone[] => {
  if (!polygon || !polygon.length) return []
  return [{ type: 'include', coords: polygon }]
}


