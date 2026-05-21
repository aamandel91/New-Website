import Router from '@koa/router'
import joi from 'joi'
import _debug from 'debug'
import { ApiError } from '../lib/errors.js'
import RepliersService from '../services/repliers.js'
import SchoolsLookupService, {
  type BestSchools,
  type SchoolLevelFilter
} from '../services/schoolsLookup.js'

const debug = _debug('repliers:routes:searchWithSchools')

const router = new Router({
  prefix: '/search'
})

const LEVELS: SchoolLevelFilter[] = ['elementary', 'middle', 'high', 'any']

const schoolSearchSchema = joi.object({
  schoolRating: joi.number().min(1).max(10).required(),
  schoolLevel: joi
    .string()
    .valid(...LEVELS)
    .default('any'),
  sortBy: joi.string().optional(),
  pageSize: joi.number().integer().min(1).max(200).default(24),
  page: joi.number().integer().min(1).default(1),
  filters: joi.object().unknown(true).default({})
})

// Listings to request from Repliers per filtered page. We over-fetch so that
// post-school-filter result count stays close to the requested pageSize.
const REPLIERS_INFLATED_PAGE_SIZE = 200

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

const getListingCoords = (
  listing: Record<string, unknown>
): { lat: number; lng: number } | null => {
  const map = listing['map'] as Record<string, unknown> | undefined
  if (!map) return null
  const lat = toNum(map['latitude'])
  const lng = toNum(map['longitude'])
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  return { lat, lng }
}

const summarizeSchools = (best: BestSchools) => {
  const summary: Record<string, { name: string; rating?: number }> = {}
  for (const lvl of ['elementary', 'middle', 'high'] as const) {
    const s = best[lvl]
    if (!s) continue
    const entry: { name: string; rating?: number } = { name: s.name }
    if (typeof s.rating === 'number') entry.rating = s.rating
    summary[lvl] = entry
  }
  return summary
}

const ratingFor = (best: BestSchools, level: SchoolLevelFilter): number => {
  if (level === 'any') {
    let max = -Infinity
    for (const lvl of ['elementary', 'middle', 'high'] as const) {
      const r = best[lvl]?.rating
      if (typeof r === 'number' && r > max) max = r
    }
    return max === -Infinity ? -Infinity : max
  }
  const r = best[level]?.rating
  return typeof r === 'number' ? r : -Infinity
}

/**
 * @openapi
 * /api/search/with-schools:
 *   post:
 *     tags:
 *       - Search
 *     summary: Listings filtered by nearby school rating
 *     description: |
 *       Opt-in slow path that runs Repliers /listings, then for each listing
 *       looks up nearby schools via cached /places calls and filters by
 *       school rating. Cache is keyed by a ~550m grid cell so listings on the
 *       same block share entries. 24-hour TTL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               schoolLevel:
 *                 type: string
 *                 enum: [elementary, middle, high, any]
 *               sortBy:
 *                 type: string
 *               pageSize:
 *                 type: integer
 *               page:
 *                 type: integer
 *               filters:
 *                 type: object
 *                 description: Repliers-compatible search filters
 *     responses:
 *       200:
 *         description: Listings filtered by school criteria, with per-listing school data.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/with-schools', async (ctx) => {
  ctx.state['enable.xff'] = true

  const { error, value } = schoolSearchSchema.validate(ctx.request.body)
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }

  const {
    schoolRating,
    schoolLevel,
    sortBy,
    pageSize,
    page,
    filters
  }: {
    schoolRating: number
    schoolLevel: SchoolLevelFilter
    sortBy?: string
    pageSize: number
    page: number
    filters: Record<string, unknown>
  } = value

  const repliers = ctx.state.container.resolve(RepliersService)
  const schoolsLookup =
    ctx.state.container.resolve(SchoolsLookupService) as SchoolsLookupService

  // Inflate page size to give us headroom after school filtering.
  // For the user's page N, we fetch the first N inflated pages of unfiltered
  // results so we have enough listings to slice from. Capped at 1 fetch for
  // simplicity (first page); deeper pages re-fetch.
  const repliersParams: Record<string, unknown> = {
    ...filters,
    resultsPerPage: REPLIERS_INFLATED_PAGE_SIZE,
    pageNum: page
  }
  // Strip school-only fields if they leaked in
  delete repliersParams['schoolRating']
  delete repliersParams['schoolLevel']

  debug('searchWithSchools rating=%d level=%s page=%d', schoolRating, schoolLevel, page)

  let listingsResponse
  try {
    listingsResponse = await repliers.listings.search(repliersParams, true)
  } catch (err) {
    debug('Repliers /listings failed: %O', err)
    ctx.throw(new ApiError('Upstream search failed', 502))
    return
  }

  const rawListings = (listingsResponse.listings as Array<
    Record<string, unknown>
  >) || []

  // Per-listing school lookup, in parallel.
  const evaluated = await Promise.all(
    rawListings.map(async (listing) => {
      const coords = getListingCoords(listing)
      if (!coords) {
        return { listing, passes: false, best: {} as BestSchools }
      }
      const result = await schoolsLookup.passesSchoolFilter(
        coords.lat,
        coords.lng,
        { rating: schoolRating, level: schoolLevel }
      )
      return {
        listing,
        passes: result.passes,
        best: result.allBest,
        bestRating: result.bestRating
      }
    })
  )

  const filtered = evaluated.filter((e) => e.passes)

  // Optional sort
  if (sortBy === 'schools') {
    filtered.sort(
      (a, b) =>
        ratingFor(b.best, schoolLevel) - ratingFor(a.best, schoolLevel)
    )
  }

  // Build the schoolData map keyed by mlsNumber and slice to requested page size.
  const sliced = filtered.slice(0, pageSize)
  const schoolDataByMlsNumber: Record<
    string,
    Record<string, { name: string; rating?: number }>
  > = {}
  for (const e of sliced) {
    const mls = e.listing['mlsNumber']
    if (typeof mls === 'string' && mls) {
      schoolDataByMlsNumber[mls] = summarizeSchools(e.best)
    }
  }

  ctx.body = {
    listings: sliced.map((e) => e.listing),
    count: filtered.length,
    page,
    pageSize,
    numPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    totalBeforeSchoolFilter: rawListings.length,
    totalAfterSchoolFilter: filtered.length,
    schoolDataByMlsNumber
  }
})

export default router
