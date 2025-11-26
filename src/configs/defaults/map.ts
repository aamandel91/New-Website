import { type MapOptions } from 'mapbox-gl'

import { type ApiLocation } from 'services/API'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY || ''

const config = {
  // Mapbox access token and default options
  mapboxDefaults: {
    zoom: 6,
    minZoom: 5,
    maxZoom: 18,
    dragRotate: false,
    doubleClickZoom: true,
    attributionControl: false,
    logoPosition: 'bottom-left',
    accessToken
  } as Partial<MapOptions>,
  // Mapbox map styles
  mapStyles: {
    map: 'streets-v12',
    hybrid: 'satellite-streets-v12',
    satellite: 'satellite-v9'
  },
  // zoom levels for search area and addresses
  defaultAreaZoom: 13,
  fallbackAreaZoom: 11,
  defaultAddressZoom: 15,
  propertyPageAddressZoom: 18,
  // Default polygon to limit searches and Repliers API requests (!)
  // Focused on Florida for Florida Home Finder
  defaultPolygon: [
    { lat: 31.0, lng: -87.5 },
    { lat: 31.0, lng: -80.0 },
    { lat: 24.5, lng: -80.0 },
    { lat: 24.5, lng: -87.5 }
  ] as ApiLocation[],
  // proximity search
  proximitySearchCenter: { lat: 27.8, lng: -82.0 } as ApiLocation,
  proximitySearchLanguage: 'en',
  proximitySearchCountry: 'US',
  proximitySearchLimit: 10
}

export type MapStyle = keyof typeof config.mapStyles

export default config
