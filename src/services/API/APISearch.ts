import queryString from 'query-string'

import searchConfig from '@configs/search'

import {
  type ApiLocations,
  type ApiQueryParams,
  type ApiQueryResponse,
  type MapboxAddress,
  type MapboxAutosuggestions
} from 'services/API'
import { getSessionToken } from 'utils/tokens'

import APIBase from './APIBase'
import APISearchCSR from './APISearchCSR'

const useCSR = !!process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY

class APISearch extends APIBase {
  fetch(params: { get?: any; post?: any }, options?: RequestInit) {
    // Use the CSR API when the key is available and there are no POST params
    // (POST params like imageSearchItems require the backend proxy)
    const hasPostParams = params.post && Object.keys(params.post).length > 0
    if (useCSR && !hasPostParams) {
      return this.fetchCSR(params.get)
    }

    // GET params
    const getParamsString = queryString.stringify(params.get, {
      arrayFormat: 'none',
      skipEmptyString: true,
      skipNull: true
    })
    // POST params
    const postParamsString =
      params.post && Object.keys(params.post).length
        ? JSON.stringify(params.post)
        : ''

    // change query method to POST if postParams are present
    return this.fetchJSON<ApiQueryResponse>(
      `/listings/search?${getParamsString}`,
      {
        ...(postParamsString
          ? {
              method: 'POST',
              body: postParamsString
            }
          : {
              method: 'GET'
            }),
        ...options
      }
    )
  }

  private async fetchCSR(getParams: Record<string, unknown>): Promise<ApiQueryResponse> {
    // Map any proxy-specific param names to CSR API names
    const params = { ...getParams }

    // Ensure boardId defaults to 110 for CSR (Florida board)
    if (!params.boardId) {
      params.boardId = 110
    }

    // Rename pageSize to resultsPerPage if present
    if (params.pageSize && !params.resultsPerPage) {
      params.resultsPerPage = params.pageSize
      delete params.pageSize
    }

    // Rename page to pageNum if present
    if (params.page && !params.pageNum) {
      params.pageNum = params.page
      delete params.page
    }

    const result = await APISearchCSR.searchListings(params as any)
    if (!result) {
      return Promise.reject({ status: 500, data: null })
    }
    return result
  }

  // TODO: should be part of SearchService
  fetchClusterWithBBox(
    params: Partial<ApiQueryParams>,
    options?: RequestInit
  ): Promise<ApiQueryResponse> {
    if (useCSR) {
      return this.fetchCSR({
        ...params,
        listings: false,
        aggregates: 'map',
        clusterPrecision: 1,
        boardId: searchConfig.defaultBoardId,
        searchFields: 'address.city,address.neighborhood'
      })
    }

    const searchParams = new URLSearchParams({
      ...params,
      listings: false,
      aggregates: 'map',
      clusterPrecision: 1,
      boardId: searchConfig.defaultBoardId,
      searchFields: 'address.city,address.neighborhood'
    } as any)
    // TODO: fix type of params mutation

    return this.fetchJSON<ApiQueryResponse>(
      `/listings/search?${searchParams}`,
      options
    )
  }

  async fetchLocations(options?: any) {
    try {
      return await this.fetchJSON<ApiLocations>(
        '/autosuggest/locations',
        options
      )
    } catch (error: any) {
      // Suppress 401 errors (expected during SSR when no auth token)
      if (error?.status !== 401) {
        console.error('[Locations] error fetching data', error)
      }
      return null
    }
  }

  async fetchAutosuggestions(q: string) {
    try {
      const params = queryString.stringify({
        mapboxSearchSession: getSessionToken(),
        q
      })

      const response = await this.fetchJSON<MapboxAutosuggestions>(
        `/autosuggest?${params}`
      )

      const {
        mapbox,
        listings: { count, listings }
      } = response

      return {
        address: (Array.from(mapbox) as MapboxAddress[]) || [],
        listings,
        count
      }
    } catch (error: any) {
      // Suppress 401 errors (expected when user not authenticated)
      // Return empty results to allow search to continue
      if (error?.status !== 401) {
        console.error('[Autosuggestions] error fetching data', error)
      }
      return {
        address: [],
        listings: [],
        count: 0
      }
    }
  }
}

const apiSearchInstance = new APISearch()
export default apiSearchInstance
