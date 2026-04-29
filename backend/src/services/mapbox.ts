import axios, { Axios, AxiosRequestConfig } from 'axios'
import { inject, injectable } from 'tsyringe'
import type { AppConfig } from '../config.js'
import { randomUUID } from 'crypto'
import _debug from 'debug'
import { ApiError } from '../lib/errors.js'

const debug = _debug('repliers:services:mapbox')
export type ApiMethod = 'GET' // Mapbox have only GET

export interface ApiRequest {
  [key: string]: unknown
}
export interface ApiResponse {
  [key: string]: unknown
}
export interface MapboxSuggestRequest extends ApiRequest {
  q: string
  language?: string
  limit?: number
  country?: string
  proximity?: `${string},${string}`
  types?: string
}
export interface MapboxSuggestion {
  name: string
  name_preferred: string
  mapbox_id: string
  feature_type: string // street
  place_formatted: string // 'Saint-Stanislas-de-Kostka, Quebec J0S 1W0, Canada',
  address: string
  full_address: string
  context: {
    country: {
      name: string
      country_code: string
    }
    region: {
      name: string
      region_code: string
    }
    postcode: {
      name: string
    }
    district: {
      name: string
    }
    place: {
      name: string
    }
    locality: {
      name: string
    }
    neighborhood: {
      name: string
    }
    address: {
      id: string
      name: string
      address_number: string
      street_name: string
    }
    street: {
      name: string
    }
  }
  language: string // 'en',
  maki: string // 'marker',
  metadata: Record<string, unknown> //{},
  distance: number //  130000
}
export interface MapboxSuggestResponse extends ApiResponse {
  suggestions: MapboxSuggestion[]
  attribution: string
}
@injectable()
export default class MapboxService {
  private axios: Axios
  constructor(
    @inject('config')
    private config: AppConfig
  ) {
    this.axios = axios.create({
      baseURL: this.config.mapbox.base_url,
      timeout: this.config.mapbox.timeout_ms,
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        access_token: this.config.mapbox.access_token
        // session_token: randomUUID(), // think about real session
      }
    })
  }
  private async request<Response>(
    method: ApiMethod,
    url: string,
    params: ApiRequest
  ): Promise<Response> {
    let options: AxiosRequestConfig = {
      method,
      url
    }
    options = {
      ...options,
      params
    }
    try {
      const axiosResponse = await this.axios.request(options)
      return axiosResponse.data
    } catch (e: any) {
      const status = e?.response?.status
      const responseData = e?.response?.data
      debug(
        '[Mapbox] request failed: url=%s params=%o status=%s message=%s',
        url,
        params,
        status,
        e?.message
      )
      throw new ApiError(
        'Mapbox API error',
        status,
        responseData ?? { message: e?.message ?? 'Unknown error' }
      )
    }
  }
  public async suggest(session_token: string, params: MapboxSuggestRequest) {
    return this.request<MapboxSuggestResponse>('GET', '/suggest', {
      ...params,
      session_token: session_token || randomUUID()
    })
  }
}
