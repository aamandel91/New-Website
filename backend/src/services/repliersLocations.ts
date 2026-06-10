import { injectable } from 'tsyringe'
import config from '../config.js'

/**
 * Filtered location data backed by the Repliers Locations API.
 *
 * Listings on this site are NOT stored in a local database \u2014 they live in
 * Repliers. So anything that needs the canonical list of cities, zip codes,
 * or neighborhoods has to call:
 *
 *   GET https://api.repliers.io/locations
 *   Header: REPLIERS-API-KEY
 *
 * The response is large (the entire MLS hierarchy: boards \u2192 classes \u2192
 * areas \u2192 cities \u2192 neighborhoods). We narrow it down to the two counties
 * the Mandel Team serves (Broward, Palm Beach) and assign deterministic
 * sequential IDs so the UI can pass them around as numbers.
 */

// The two counties this site serves. Kept here intentionally so the backend
// doesn't need to import the frontend config; the frontend has the same
// list at src/configs/defaults/page-generation.ts.
const TARGET_COUNTIES = ['Broward', 'Palm Beach'] as const

// Repliers Locations API response shape (only the bits we use).
interface RepliersNeighborhood {
  name: string
  activeCount?: number
}

interface RepliersCity {
  name: string
  zip?: string | string[] // some boards return a single zip, some a list
  neighborhoods?: RepliersNeighborhood[]
  activeCount?: number
}

interface RepliersArea {
  name: string
  cities: RepliersCity[]
}

interface RepliersClass {
  name: string
  areas: RepliersArea[]
}

interface RepliersBoard {
  boardId: number
  name: string
  classes: RepliersClass[]
}

interface RepliersLocationsResponse {
  boards: RepliersBoard[]
}

// Output shapes we expose to callers (service + route consumers).
export interface CityLocation {
  id: number
  name: string
  county: string
}

export interface ZipLocation {
  id: number
  zip: string
  city: string
  county: string
}

export interface NeighborhoodLocation {
  id: number
  name: string
  city: string
  county: string
}

@injectable()
export class RepliersLocationsService {
  // 24-hour in-memory cache. The MLS area hierarchy changes very rarely, so
  // hammering the Repliers API on every admin page load is wasteful.
  private cache: {
    response: RepliersLocationsResponse
    expiresAt: number
  } | null = null

  private readonly cacheTtlMs = 24 * 60 * 60 * 1000

  /**
   * Fetch the full Locations response from Repliers (with cache).
   */
  private async fetchLocations(): Promise<RepliersLocationsResponse> {
    const now = Date.now()
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.response
    }

    const url = `${config.repliers.base_url}/locations`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'REPLIERS-API-KEY': config.repliers.api_key,
        'content-type': 'application/json'
      }
    })

    if (!res.ok) {
      throw new Error(
        `Repliers /locations request failed: ${res.status} ${res.statusText}`
      )
    }

    const json = (await res.json()) as RepliersLocationsResponse
    this.cache = { response: json, expiresAt: now + this.cacheTtlMs }
    return json
  }

  /**
   * Walk the boards/classes hierarchy and return every (county, city) pair
   * for the target counties only. De-duplicates the same city appearing
   * across multiple classes (e.g. residential + condo).
   */
  private async getTargetCountyCities(): Promise<
    Array<{ county: string; city: RepliersCity }>
  > {
    const response = await this.fetchLocations()

    // Map ensures we keep one canonical RepliersCity (the one with the most
    // neighborhoods, since that's the most useful) per "county|cityName" key.
    const seen = new Map<string, { county: string; city: RepliersCity }>()

    for (const board of response.boards) {
      for (const cls of board.classes) {
        for (const area of cls.areas) {
          if (!(TARGET_COUNTIES as readonly string[]).includes(area.name)) {
            continue
          }
          for (const city of area.cities) {
            const key = `${area.name}|${city.name.toLowerCase()}`
            const existing = seen.get(key)
            const candidateCount = city.neighborhoods?.length ?? 0
            const existingCount = existing?.city.neighborhoods?.length ?? 0
            if (!existing || candidateCount > existingCount) {
              seen.set(key, { county: area.name, city })
            }
          }
        }
      }
    }

    // Sort by county then city for stable, predictable IDs.
    return Array.from(seen.values()).sort((a, b) => {
      if (a.county !== b.county) return a.county.localeCompare(b.county)
      return a.city.name.localeCompare(b.city.name)
    })
  }

  /**
   * List of cities in Broward + Palm Beach with sequential IDs.
   */
  async getCities(): Promise<CityLocation[]> {
    const pairs = await this.getTargetCountyCities()
    return pairs.map(({ county, city }, index) => ({
      id: index + 1,
      name: city.name,
      county
    }))
  }

  /**
   * Given a list of city IDs (from getCities()), return the matching cities.
   */
  async getCitiesByIds(ids: number[]): Promise<CityLocation[]> {
    const all = await this.getCities()
    const set = new Set(ids)
    return all.filter((c) => set.has(c.id))
  }

  /**
   * List of (zip, city, county) tuples for Broward + Palm Beach with
   * sequential IDs. A city can have multiple zips.
   */
  async getZipCodes(): Promise<ZipLocation[]> {
    const pairs = await this.getTargetCountyCities()

    // Use a Map keyed by zip so duplicates (same zip across boards) collapse.
    const zipMap = new Map<string, ZipLocation>()
    let next = 1
    for (const { county, city } of pairs) {
      const zips: string[] = []
      if (Array.isArray(city.zip)) zips.push(...city.zip)
      else if (city.zip) zips.push(city.zip)

      for (const zip of zips) {
        const cleaned = zip.trim()
        if (!cleaned || zipMap.has(cleaned)) continue
        zipMap.set(cleaned, {
          id: next,
          zip: cleaned,
          city: city.name,
          county
        })
        next += 1
      }
    }

    return Array.from(zipMap.values()).sort((a, b) =>
      a.zip.localeCompare(b.zip)
    )
  }

  /**
   * Given a list of zip IDs, return the matching ZipLocation entries.
   */
  async getZipCodesByIds(ids: number[]): Promise<ZipLocation[]> {
    const all = await this.getZipCodes()
    const set = new Set(ids)
    return all.filter((z) => set.has(z.id))
  }

  /**
   * Neighborhoods across all target-county cities, with sequential IDs.
   * Optionally filter by a city name (case-insensitive).
   */
  async getNeighborhoods(cityFilter?: string): Promise<NeighborhoodLocation[]> {
    const pairs = await this.getTargetCountyCities()
    const filterLower = cityFilter?.toLowerCase()

    const out: NeighborhoodLocation[] = []
    let next = 1
    for (const { county, city } of pairs) {
      if (filterLower && city.name.toLowerCase() !== filterLower) continue
      const neighborhoods = city.neighborhoods ?? []
      for (const n of neighborhoods) {
        out.push({
          id: next,
          name: n.name,
          city: city.name,
          county
        })
        next += 1
      }
    }
    return out.sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city)
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Given a list of neighborhood IDs, return the matching entries.
   */
  async getNeighborhoodsByIds(ids: number[]): Promise<NeighborhoodLocation[]> {
    const all = await this.getNeighborhoods()
    const set = new Set(ids)
    return all.filter((n) => set.has(n.id))
  }
}
