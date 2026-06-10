import mapConfig from '@configs/map'

import { type ApiBounds, type ApiQueryParams, APISearch } from 'services/API'
// Do not import the 'services/Map' barrel statically: it chains to
// MarkerExtension -> mapbox-gl runtime (~1.5MB) and this service is pulled
// into the site-wide Header. MapSearch is HTTP-only; the live map singleton
// is loaded lazily (instant on map pages where mapbox is already in memory).
import MapSearch from 'services/Map/MapSearch'

const getLiveMap = async () =>
  (await import('services/Map')).default.map
import { processParams } from 'services/Search/adapter'
import { calcBoundsAtZoom, calcZoomLevel } from 'utils/map'

import { getDefaultRectangle, getListingFields } from './params'
import { type Filters } from './types'

const { defaultAddressZoom, defaultAreaZoom, fallbackAreaZoom } = mapConfig

class SearchService {
  private abortController: AbortController | undefined

  private disabled = false

  disableRequests() {
    this.disabled = true
    if (this.abortController) {
      this.abortController.abort('disableRequests')
    }
  }

  enableRequests() {
    this.disabled = false
  }

  async fetch(params: Partial<ApiQueryParams | Filters>) {
    if (this.disabled) return Promise.reject()

    this.abortController = new AbortController()

    let response
    try {
      response = await APISearch.fetch(
        { ...processParams(params) },
        { signal: this.abortController.signal }
      )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return Promise.reject()
    }
    // everything is fine but the current user interaction
    // disabled fetches AFTER we started this request
    return this.disabled ? Promise.reject() : response
  }

  async fetchListings(params: any) {
    return this.fetch({
      ...params,
      ...getDefaultRectangle(),
      ...getListingFields()
    })
  }

  async fetchBoundsForArea(query: string) {
    const { aggregates } = await APISearch.fetchClusterWithBBox({
      search: query,
      status: 'A'
    })
    // get bounds and center point of the area from API
    const { bounds, location } = aggregates?.map?.clusters?.[0] || {}

    const map = await getLiveMap()
    if (map && bounds && location) {
      const areaZoom = calcZoomLevel(map, bounds)

      // NOTE: object' bounds are too big to be the real area,
      // lets fallback to its center point with the default zoom level for areas
      if (areaZoom < fallbackAreaZoom) {
        const fallbackBounds = calcBoundsAtZoom(map, location, defaultAreaZoom)
        return fallbackBounds
      }
    }

    return bounds
  }

  async fetchBoundsForAddress(query: string): Promise<ApiBounds | undefined> {
    const map = await getLiveMap()
    if (!map) return undefined

    const address = await MapSearch.fetchMapboxSuggestion(query)
    const point = address
      ? await MapSearch.fetchMapboxAddressPoint(address)
      : undefined

    return point && map
      ? calcBoundsAtZoom(map, point, defaultAddressZoom)
      : undefined
  }
}

const searchServiceInstance = new SearchService()
export default searchServiceInstance
