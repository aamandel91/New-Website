import { inject, injectable } from 'tsyringe'
import RepliersService from './repliers.js'
import _debug from 'debug'

const debug = _debug('repliers:services:schoolsLookup')

export type SchoolLevel = 'elementary' | 'middle' | 'high'
export type SchoolLevelFilter = SchoolLevel | 'any'

export interface School {
  name: string
  rating?: number
  level?: SchoolLevel
  distanceKm?: number
}

export interface BestSchools {
  elementary?: School
  middle?: School
  high?: School
}

interface CacheEntry {
  expiresAt: number
  schools: School[]
}

// ~0.005° grid (~550m at the equator, ~470m at FL latitude). Listings on the
// same block share a cache entry.
const GRID = 200
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const gridKey = (lat: number, lng: number) =>
  `${Math.round(lat * GRID) / GRID},${Math.round(lng * GRID) / GRID}`

const normalizeLevel = (raw: unknown): SchoolLevel | undefined => {
  if (typeof raw !== 'string') return undefined
  const s = raw.toLowerCase()
  if (s.includes('elem') || s.includes('primary')) return 'elementary'
  if (s.includes('middle') || s.includes('junior')) return 'middle'
  if (s.includes('high') || s.includes('secondary') || s.includes('senior'))
    return 'high'
  return undefined
}

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

@injectable()
export default class SchoolsLookupService {
  // Cache shared across all callers in this process. 24h TTL.
  private static cache = new Map<string, CacheEntry>()

  constructor(@inject(RepliersService) private repliers: RepliersService) {}

  // For tests / introspection.
  static _resetCache() {
    SchoolsLookupService.cache.clear()
  }
  static _cacheSize() {
    return SchoolsLookupService.cache.size
  }

  async getSchoolsAt(lat: number, lng: number): Promise<School[]> {
    const key = gridKey(lat, lng)
    const now = Date.now()
    const hit = SchoolsLookupService.cache.get(key)
    if (hit && hit.expiresAt > now) {
      debug('cache hit %s', key)
      return hit.schools
    }
    if (hit) SchoolsLookupService.cache.delete(key)

    let raw: Record<string, unknown> | undefined
    try {
      raw = await this.repliers.listings.places({
        lat: String(lat),
        long: String(lng)
      })
    } catch (err) {
      debug('places lookup failed for %s: %O', key, err)
      // Cache empty result for a shorter window so we don't hammer on errors,
      // but still serve fast paths. Use 5 min on failure.
      SchoolsLookupService.cache.set(key, {
        schools: [],
        expiresAt: now + 5 * 60 * 1000
      })
      return []
    }

    const rawList = (raw && (raw['schools'] as unknown)) || []
    const schools: School[] = Array.isArray(rawList)
      ? rawList
          .map((entry): School | null => {
            if (!entry || typeof entry !== 'object') return null
            const e = entry as Record<string, unknown>
            const name =
              (e['name'] as string) ||
              (e['school_name'] as string) ||
              ''
            if (!name) return null
            const rating = toNum(e['rating'])
            const level = normalizeLevel(
              e['level'] || e['type'] || e['grade'] || e['gradeLevel']
            )
            const distanceKm = toNum(e['distance'] ?? e['distanceKm'])
            const school: School = { name }
            if (typeof rating === 'number') school.rating = rating
            if (level) school.level = level
            if (typeof distanceKm === 'number') school.distanceKm = distanceKm
            return school
          })
          .filter((s): s is School => !!s)
      : []

    SchoolsLookupService.cache.set(key, {
      schools,
      expiresAt: now + TTL_MS
    })
    debug('cache miss %s -> %d schools', key, schools.length)
    return schools
  }

  async getBestSchoolsAt(lat: number, lng: number): Promise<BestSchools> {
    const schools = await this.getSchoolsAt(lat, lng)
    const best: BestSchools = {}
    for (const s of schools) {
      if (!s.level || typeof s.rating !== 'number') continue
      const cur = best[s.level]
      if (!cur || (cur.rating ?? -Infinity) < s.rating) {
        best[s.level] = s
      }
    }
    return best
  }

  // Determines whether a listing's coordinate passes a school filter and
  // returns the matching best school + per-level summary so the API caller
  // can attach it to the listing card.
  async passesSchoolFilter(
    lat: number,
    lng: number,
    opts: { rating: number; level: SchoolLevelFilter }
  ): Promise<{
    passes: boolean
    bestSchool?: School
    bestRating?: number
    allBest: BestSchools
  }> {
    const allBest = await this.getBestSchoolsAt(lat, lng)

    let candidate: School | undefined
    if (opts.level === 'any') {
      for (const lvl of ['elementary', 'middle', 'high'] as SchoolLevel[]) {
        const s = allBest[lvl]
        if (s && typeof s.rating === 'number') {
          if (!candidate || (candidate.rating ?? -Infinity) < s.rating) {
            candidate = s
          }
        }
      }
    } else {
      candidate = allBest[opts.level]
    }

    const passes =
      !!candidate &&
      typeof candidate.rating === 'number' &&
      candidate.rating >= opts.rating

    const result: {
      passes: boolean
      bestSchool?: School
      bestRating?: number
      allBest: BestSchools
    } = { passes, allBest }
    if (candidate) result.bestSchool = candidate
    if (candidate && typeof candidate.rating === 'number') {
      result.bestRating = candidate.rating
    }
    return result
  }
}
