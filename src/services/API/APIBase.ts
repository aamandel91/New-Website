import apiConfig from '@configs/api'

import { clearToken, expired, getToken } from 'utils/tokens'
import { getForwardedFrom } from 'utils/xff'

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`

class APIBase {
  getAbsoluteUrl(url: string) {
    return url.startsWith('http') ? url : API_URL + url
  }

  async getHeaders() {
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')

    const forwarded = await getForwardedFrom()
    if (forwarded) {
      headers.append('X-Forwarded-For-Token', forwarded.token)
      headers.append('X-Forwarded-From', forwarded.from)
    }

    const token = await getToken()
    if (token && !expired(token)) {
      headers.append('Authorization', `Bearer ${token}`)
    }

    return headers
  }

  async fetchRaw(request: string, options?: RequestInit): Promise<Response> {
    const headers = await this.getHeaders()

    try {
      const response = await fetch(this.getAbsoluteUrl(request), {
        ...options,
        headers
      })
      if (!response.ok) {
        // Suppress 401 errors (expected for unauthenticated users)
        if (response.status !== 401) {
          console.error(`HTTP Error: ${response.status}`, request)
        }
      }
      return response
    } catch (error: any) {
      if (error.message === '401') {
        console.error('Authorization header is invalid or expired.')
        clearToken()
      }
      // Instead of throwing the error, return a response-like fallback
      return new Response(null, { status: 503 })
    }
  }

  async fetchJSON<T>(request: string, options?: RequestInit): Promise<T> {
    let response: Response | null = null
    // there are few queries that has custom abort signal
    if (options?.signal) {
      response = await this.fetchRaw(request, options)
    } else {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        apiConfig.apiRequestTimeout
      ) // 10 seconds

      response = await this.fetchRaw(request, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
    }

    // Always parse the JSON response
    let data: any = null
    let parseError: unknown = null
    try {
      data = await response.json()
    } catch (error) {
      parseError = error
      // Body may legitimately be empty (e.g. 204) — only log unexpected failures.
      if (response?.ok) {
        console.error('Failed to parse JSON response', request, error)
      }
    }

    if (response?.ok) {
      return data as T
    } else {
      // Reject with an object containing both status and JSON body so callers
      // can decide. Preserve the original parse error for debugging.
      return Promise.reject({
        status: response.status,
        data,
        parseError
      })
    }
  }

  /**
   * Cookie-free fetch for PUBLIC, read-only data (CMS pages, SEO templates,
   * navigation, locations). Regular fetchJSON reads the auth cookie via
   * getHeaders() -> cookies(), which opts the entire route into dynamic
   * rendering and disables ISR. This method skips cookies/headers entirely
   * and applies Next.js fetch-level caching so SEO pages can be served from
   * cache instead of hitting the backend on every crawl.
   *
   * Only use for endpoints that never vary by user.
   */
  async publicFetchJSON<T>(
    request: string,
    revalidateSeconds: number = 3600
  ): Promise<T> {
    const response = await fetch(this.getAbsoluteUrl(request), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: revalidateSeconds }
    }).catch(() => new Response(null, { status: 503 }))

    let data: any = null
    let parseError: unknown = null
    try {
      data = await response.json()
    } catch (error) {
      parseError = error
    }

    if (response.ok) {
      return data as T
    }
    return Promise.reject({ status: response.status, data, parseError })
  }
}

export default APIBase
