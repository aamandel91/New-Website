import axios, { Axios, AxiosRequestConfig } from 'axios'
import { inject, injectable } from 'tsyringe'
import type { AppConfig } from '../config.js'
import _debug from 'debug'
import { ApiError } from '../lib/errors.js'

const debug = _debug('repliers:services:google')
export type ApiMethod = 'GET'
export interface ApiRequest {
  [key: string]: unknown
}
export interface ApiResponse {
  [key: string]: unknown
}
export interface GoogleAutocompleteSuggestRequest extends ApiRequest {
  input: string
  types: string // address
  language: string
  location: `${string},${string}`
  components: string // 'country:ca'
  radius: number // 10000
  sessiontoken: string
  strictbounds?: boolean // true
  locationrestriction?: string
}
export interface GoogleAutocompleteResponse extends ApiResponse {
  status: string // 'OK',
  predictions: {
    description: string
    matched_substrings: {
      length: number
      offset: number
    }[]
    place_id: string
    reference: string
    structured_formatting: {
      main_text: string
      main_text_matched_substrings: {
        length: number
        offset: number
      }[]
      secondary_text: string
    }
    terms: {
      offset: number
      value: string
    }[]
    types: string[]
  }[]
}
@injectable()
export default class GoogledService {
  private axios: Axios
  constructor(
    @inject('config')
    private config: AppConfig
  ) {
    this.axios = axios.create({
      baseURL: this.config.googlemaps.base_url,
      timeout: this.config.googlemaps.timeout_ms,
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        key: this.config.googlemaps.key
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
        '[Google] request failed: url=%s params=%o status=%s message=%s',
        url,
        params,
        status,
        e?.message
      )
      throw new ApiError(
        'Google API error',
        status,
        responseData ?? { message: e?.message ?? 'Unknown error' }
      )
    }
  }
  public async autocomplete(params: GoogleAutocompleteSuggestRequest) {
    return this.request<GoogleAutocompleteResponse>(
      'GET',
      '/place/autocomplete/json',
      params
    )
  }
}
