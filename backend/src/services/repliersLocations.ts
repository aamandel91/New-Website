import { injectable } from 'tsyringe'
import config from '../config.js'

/**
 * Filtered location data backed by the Repliers API.
 *
 * Listings on this site are NOT stored in a local database - they live in
 * Repliers. So anything that needs the canonical list of cities, zip codes,
 * or neighborhoods has to ask Repliers.
 *
 * NOTE (2026-06): Repliers replaced the old nested /locations hierarchy
 * (boards -> classes -> areas -> cities -> neighborhoods) with a PAGINATED
 * FLAT format: GET /locations?area={county}&type={city|neighborhood} returns
 * { page, numPages, locations: [{ name, type, address: { city, area, ... } }] }.
 * This service now consumes that format, and additionally merges in the
 * listing aggregates endpoint (aggregates=address.city,address.zip) because:
 *   1. the MLS location hierarchy is sparse for cities in some boards, and
 *   2. the new /locations format carries no zip codes at all.
 * Merging both sources means the page generator sees every city that either
 * exists in the MLS hierarchy OR has at least one active listing.
 */

// The two counties this site serves. Kept here intentionally so the backend
// doesn't need to import the frontend config; the frontend has the same
// list at src/configs/defaults/page-generation.ts.
const TARGET_COUNTIES = ['Broward', 'Palm Beach'] as const

// ─── New Repliers /locations response (paginated flat) ──────────────────────
interface RepliersLocation {
  name: string
  type: string // 'city' | 'neighborhood' | 'area' | ...
  address?: {
    city?: string
    area?: string
    state?: string
    neighborhood?: string
  }
}

interface RepliersLocationsPage {
  page: number
  numPages: number
  locations: RepliersLocation[]
}

// Listing aggregates response (only the bits we use)
interface RepliersAggregatesResponse {
  aggregates?: {
    address?: {
      city?: Record<string, number>
      zip?: Record<string, number>
    }
  }
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

/** "CORAL SPRINGS" / "coral springs" -> "Coral Springs" */
const toTitleCase = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim()

interface CountyData {
  cities: Map<string, string> // lowercase key -> display name
  neighborhoods: Array<{ name: string; city: string }>
  zips: string[]
}

@injectable()
export class RepliersLocationsService {
  // 24-hour in-memory cache per county. The MLS area data changes very
  // rarely, so hammering the Repliers API on every admin page load is
  // wasteful.
  private cache = new Map<string, { data: CountyData; expiresAt: number }>()

  private readonly cacheTtlMs = 24 * 60 * 60 * 1000

  private get headers(): Record<string, string> {
    return {
      'REPLIERS-API-KEY': config.repliers.api_key,
      'Content-Type': 'application/json'
    }
  }

  /** Paginate /locations for one county and one type. */
  private async fetchLocationsByType(
    county: string,
    type: 'city' | 'neighborhood'
  ): Promise<RepliersLocation[]> {
    const out: RepliersLocation[] = []
    let page = 1
    let numPages = 1
    // Hard cap on pages as a safety net against runaway pagination.
    const maxPages = 50
    while (page <= numPages && page <= maxPages) {
      const url =
        `${config.repliers.base_url}/locations?` +
        `area=${encodeURIComponent(county)}&type=${type}` +
        `&dropCoordinates=true&pageSize=100&page=${page}`
      const res = await fetch(url, { headers: this.headers })
      if (!res.ok) {
        throw new Error(
          `Repliers /locations request failed: ${res.status} ${res.statusText}`
        )
      }
      const json = (await res.json()) as RepliersLocationsPage
      if (Array.isArray(json.locations)) out.push(...json.locations)
      numPages = json.numPages ?? 1
      page += 1
    }
    return out
  }

  /** One aggregates call per county: cities-with-listings + zip codes. */
  private async fetchCountyAggregates(
    county: string
  ): Promise<{ cities: string[]; zips: string[] }> {
    const url =
      `${config.repliers.base_url}/listings?` +
      `aggregates=address.city,address.zip&listings=false&status=A` +
      `&area=${encodeURIComponent(county)}`
    const res = await fetch(url, { headers: this.headers })
    if (!res.ok) {
      throw new Error(
        `Repliers aggregates request failed: ${res.status} ${res.statusText}`
      )
    }
    const json = (await res.json()) as RepliersAggregatesResponse
    const addr = json.aggregates?.address ?? {}
    return {
      cities: Object.keys(addr.city ?? {}),
      zips: Object.keys(addr.zip ?? {})
    }
  }

  /** Fetch + merge + cache everything we need for one county. */
  private async getCountyData(county: string): Promise<CountyData> {
    const now = Date.now()
    const cached = this.cache.get(county)
    if (cached && cached.expiresAt > now) return cached.data

    const [cityLocations, neighborhoodLocations, aggregates] =
      await Promise.all([
        this.fetchLocationsByType(county, 'city'),
        this.fetchLocationsByType(county, 'neighborhood'),
        this.fetchCountyAggregates(county)
      ])

    // Cities: union of MLS hierarchy cities and cities with active listings.
    const cities = new Map<string, string>()
    for (const loc of cityLocations) {
      const display = toTitleCase(loc.name)
      if (display) cities.set(display.toLowerCase(), display)
    }
    for (const name of aggregates.cities) {
      const display = toTitleCase(name)
      if (display && !cities.has(display.toLowerCase())) {
        cities.set(display.toLowerCase(), display)
      }
    }

    // Neighborhoods: name + parent city from the location's address block.
    const seenNeighborhoods = new Set<string>()
    const neighborhoods: Array<{ name: string; city: string }> = []
    for (const loc of neighborhoodLocations) {
      const name = (loc.name || '').trim()
      if (!name) continue
      const city = toTitleCase(loc.address?.city || '')
      const key = `${city.toLowerCase()}|${name.toLowerCase()}`
      if (seenNeighborhoods.has(key)) continue
      seenNeighborhoods.add(key)
      neighborhoods.push({ name, city })
    }

    // Zips: the new /locations format has no zip data, so listing aggregates
    // are the only source. (Zip -> city mapping is not available from a
    // single aggregates call; ZipLocation.city stays empty.)
    const zips = aggregates.zips
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z))

    const data: CountyData = { cities, neighborhoods, zips }
    this.cache.set(county, { data, expiresAt: now + this.cacheTtlMs })
    return data
  }

  /**
   * List of cities in Broward + Palm Beach with sequential IDs.
   * Sorted by county then city for stable, predictable IDs.
   */
  async getCities(): Promise<CityLocation[]> {
    const out: CityLocation[] = []
    for (const county of TARGET_COUNTIES) {
      const data = await this.getCountyData(county)
      const names = Array.from(data.cities.values()).sort((a, b) =>
        a.localeCompare(b)
      )
      for (const name of names) out.push({ id: 0, name, county })
    }
    return out.map((c, index) => ({ ...c, id: index + 1 }))
  }

  /** Given a list of city IDs (from getCities()), return matching cities. */
  async getCitiesByIds(ids: number[]): Promise<CityLocation[]> {
    const all = await this.getCities()
    const set = new Set(ids)
    return all.filter((c) => set.has(c.id))
  }

  /**
   * List of (zip, city, county) tuples for Broward + Palm Beach with
   * sequential IDs.
   */
  async getZipCodes(): Promise<ZipLocation[]> {
    const out: ZipLocation[] = []
    for (const county of TARGET_COUNTIES) {
      const data = await this.getCountyData(county)
      for (const zip of [...data.zips].sort()) {
        out.push({ id: 0, zip, city: '', county })
      }
    }
    // De-dupe across counties (a zip should only belong to one, but be safe).
    const seen = new Set<string>()
    const deduped = out.filter((z) =>
      seen.has(z.zip) ? false : (seen.add(z.zip), true)
    )
    return deduped.map((z, index) => ({ ...z, id: index + 1 }))
  }

  /** Given a list of zip IDs, return the matching ZipLocation entries. */
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
    const filterLower = cityFilter?.toLowerCase()
    const out: NeighborhoodLocation[] = []
    for (const county of TARGET_COUNTIES) {
      const data = await this.getCountyData(county)
      for (const n of data.neighborhoods) {
        if (filterLower && n.city.toLowerCase() !== filterLower) continue
        out.push({ id: 0, name: n.name, city: n.city, county })
      }
    }
    out.sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city)
      return a.name.localeCompare(b.name)
    })
    return out.map((n, index) => ({ ...n, id: index + 1 }))
  }

  /** Given a list of neighborhood IDs, return the matching entries. */
  async getNeighborhoodsByIds(
    ids: number[]
  ): Promise<NeighborhoodLocation[]> {
    const all = await this.getNeighborhoods()
    const set = new Set(ids)
    return all.filter((n) => set.has(n.id))
  }
}

export default RepliersLocationsService
