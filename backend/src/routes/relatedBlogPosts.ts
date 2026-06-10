import Router from '@koa/router'
import {
  RelatedBlogPostsService,
  type RelatedPageType,
  type RelatedFetchOpts
} from '../services/relatedBlogPosts.js'

const router = new Router({ prefix: '/related-blog-posts' })

const VALID_PAGE_TYPES: RelatedPageType[] = [
  'city',
  'city_subtype',
  'neighborhood',
  'zip',
  'property_type',
  'search'
]

function pickStr(value: unknown): string | undefined {
  if (Array.isArray(value))
    return typeof value[0] === 'string' ? value[0] : undefined
  if (typeof value === 'string' && value.length > 0) return value
  return undefined
}

/**
 * GET /api/related-blog-posts
 * Public read. Query params: pageType, city, citySlug, subtype, neighborhood,
 * zip, county, propertyType, limit.
 */
router.get('/', async (ctx) => {
  const query = ctx.query as Record<string, unknown>
  const pageType = pickStr(query['pageType']) as RelatedPageType | undefined

  if (!pageType || !VALID_PAGE_TYPES.includes(pageType)) {
    ctx.status = 400
    ctx.body = { error: 'Invalid pageType' }
    return
  }

  const limitRaw = pickStr(query['limit'])
  const limit = limitRaw
    ? Math.max(1, Math.min(10, parseInt(limitRaw, 10) || 5))
    : 5

  const opts: RelatedFetchOpts = {
    pageType,
    limit
  }

  const city = pickStr(query['city'])
  if (city) opts.city = city
  const citySlug = pickStr(query['citySlug'])
  if (citySlug) opts.citySlug = citySlug
  const subtype = pickStr(query['subtype'])
  if (subtype) opts.subtype = subtype
  const neighborhood = pickStr(query['neighborhood'])
  if (neighborhood) opts.neighborhood = neighborhood
  const zip = pickStr(query['zip'])
  if (zip) opts.zip = zip
  const county = pickStr(query['county'])
  if (county) opts.county = county
  const countySlug = pickStr(query['countySlug'])
  if (countySlug) opts.countySlug = countySlug
  const propertyType = pickStr(query['propertyType'])
  if (propertyType) opts.propertyType = propertyType

  const service = ctx.state['container'].resolve(RelatedBlogPostsService)
  const posts = await service.findForPage(opts)

  ctx.body = { posts }
})

export default router
