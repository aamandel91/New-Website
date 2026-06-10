import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { AIContentService } from '../services/aiContent.js'
import { BulkPageGenerationService } from '../services/bulkPageGeneration.js'
import { RepliersLocationsService } from '../services/repliersLocations.js'
import { KeywordQueueService } from '../services/keywordQueue.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import type {
  AIBlogPostRequest,
  AIPageContentRequest,
  BulkPageGenerationRequest,
  CrossProductGenerationRequest,
  CrossProductCombination
} from '../types/aiContent.js'
import type {
  KeywordQueueInsertItem,
  KeywordQueueStatus
} from '../types/keywordQueue.js'

const router = new Router({
  prefix: '/ai-content'
})
const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware =
  container.resolve<RoleMiddlewareCreator>('middleware.role')

/**
 * POST /api/ai-content/blog
 * Generate a blog post with AI
 */
router.post(
  '/blog',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(AIContentService)
    const request = ctx.request.body as AIBlogPostRequest

    if (!request.keyword) {
      ctx.status = 400
      ctx.body = { error: 'Keyword is required' }
      return
    }

    const result = await service.generateBlogPost(request)
    ctx.body = result
  }
)

/**
 * POST /api/ai-content/keywords
 * Suggest keywords for a topic
 */
router.post(
  '/keywords',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(AIContentService)
    const { topic, city } = ctx.request.body as { topic: string; city?: string }

    if (!topic) {
      ctx.status = 400
      ctx.body = { error: 'Topic is required' }
      return
    }

    const keywords = await service.suggestKeywords(topic, city)
    ctx.body = { keywords }
  }
)

/**
 * POST /api/ai-content/page
 * Generate page content with AI
 */
router.post(
  '/page',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(AIContentService)
    const request = ctx.request.body as AIPageContentRequest

    if (!request.pageType || !request.keyword) {
      ctx.status = 400
      ctx.body = { error: 'Page type and keyword are required' }
      return
    }

    const result = await service.generatePageContent(request)
    ctx.body = result
  }
)

/**
 * POST /api/ai-content/batch
 * Generate multiple pages with AI
 */
router.post(
  '/batch',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(AIContentService)
    const { requests } = ctx.request.body as {
      requests: AIPageContentRequest[]
    }

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      ctx.status = 400
      ctx.body = { error: 'Requests array is required' }
      return
    }

    if (requests.length > 50) {
      ctx.status = 400
      ctx.body = { error: 'Maximum 50 pages per batch' }
      return
    }

    const results = await service.generateBatchContent(requests)
    ctx.body = { results }
  }
)

/**
 * POST /api/ai-content/bulk-pages/preview
 * Preview bulk page generation
 */
router.post(
  '/bulk-pages/preview',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(BulkPageGenerationService)
    const request = ctx.request.body as BulkPageGenerationRequest

    if (
      !request.pageType ||
      !request.selectedIds ||
      request.selectedIds.length === 0
    ) {
      ctx.status = 400
      ctx.body = { error: 'Page type and selected IDs are required' }
      return
    }

    const preview = await service.previewPages(request)
    ctx.body = { preview }
  }
)

/**
 * POST /api/ai-content/bulk-pages/generate
 * Generate pages in bulk.
 *
 * Two modes:
 *   - default (no `mode` field, or `mode: 'singleAxis'`): single-axis page
 *     generation (city / zipcode / neighborhood / property_type) — body
 *     shape is BulkPageGenerationRequest.
 *   - `mode: 'crossProduct'`: city × subtype cross-product generation —
 *     body shape is CrossProductGenerationRequest. Used by the SEO
 *     Coverage dashboard's "Generate Missing" handoff.
 */
router.post(
  '/bulk-pages/generate',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(BulkPageGenerationService)
    const orgId = ctx.state['orgId']
    const body = ctx.request.body as
      | (BulkPageGenerationRequest & { mode?: 'singleAxis' })
      | (CrossProductGenerationRequest & { mode: 'crossProduct' })

    if (body && (body as any).mode === 'crossProduct') {
      const cpReq = body as CrossProductGenerationRequest
      if (
        !Array.isArray(cpReq.combinations) ||
        cpReq.combinations.length === 0
      ) {
        ctx.status = 400
        ctx.body = {
          error: 'combinations array is required for crossProduct mode'
        }
        return
      }
      if (cpReq.combinations.length > 200) {
        ctx.status = 400
        ctx.body = {
          error: 'Maximum 200 combinations per cross-product generation'
        }
        return
      }
      const invalid = cpReq.combinations.find(
        (c: CrossProductCombination) =>
          !c ||
          typeof c.city !== 'string' ||
          typeof c.subtype !== 'string' ||
          c.city.trim() === '' ||
          c.subtype.trim() === ''
      )
      if (invalid) {
        ctx.status = 400
        ctx.body = {
          error: 'Each combination must have non-empty city and subtype strings'
        }
        return
      }

      const result = await service.generateCrossProductPages(orgId, cpReq)
      ctx.body = result
      return
    }

    const request = body as BulkPageGenerationRequest
    if (
      !request.pageType ||
      !request.selectedIds ||
      request.selectedIds.length === 0
    ) {
      ctx.status = 400
      ctx.body = { error: 'Page type and selected IDs are required' }
      return
    }

    if (request.selectedIds.length > 100) {
      ctx.status = 400
      ctx.body = { error: 'Maximum 100 pages per bulk generation' }
      return
    }

    const result = await service.generatePages(orgId, request)
    ctx.body = result
  }
)

/**
 * GET /api/ai-content/locations/cities
 * List all Broward + Palm Beach cities (from Repliers /locations) for the
 * Bulk Page Generator UI. Returns sequential IDs the UI can pass back as
 * selectedIds when calling /preview or /generate.
 */
router.get(
  '/locations/cities',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(RepliersLocationsService)
    const cities = await service.getCities()
    ctx.body = { cities }
  }
)

/**
 * GET /api/ai-content/locations/zipcodes
 * List all zip codes in the target counties.
 */
router.get(
  '/locations/zipcodes',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(RepliersLocationsService)
    const zipcodes = await service.getZipCodes()
    ctx.body = { zipcodes }
  }
)

/**
 * GET /api/ai-content/locations/neighborhoods?city=Boca+Raton
 * List neighborhoods, optionally filtered to a single city.
 */
router.get(
  '/locations/neighborhoods',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state.container.resolve(RepliersLocationsService)
    const cityFilter = (ctx.query['city'] as string | undefined) || undefined
    const neighborhoods = await service.getNeighborhoods(cityFilter)
    ctx.body = { neighborhoods }
  }
)

/**
 * GET /api/ai-content/keyword-queue
 * List queue. Filters: ?status=pending&city=Boca+Raton&priority_min=5
 * Sorted priority DESC, created_at ASC. Capped at 500 rows.
 */
router.get(
  '/keyword-queue',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(KeywordQueueService)
    const status = ctx.query['status'] as string | undefined
    const city = ctx.query['city'] as string | undefined
    const priorityMinRaw = ctx.query['priority_min'] as string | undefined

    const allowedStatuses: KeywordQueueStatus[] = [
      'pending',
      'generating',
      'done',
      'failed'
    ]
    if (status && !allowedStatuses.includes(status as KeywordQueueStatus)) {
      ctx.status = 400
      ctx.body = { error: 'Invalid status filter' }
      return
    }

    const priorityMin =
      priorityMinRaw !== undefined ? Number(priorityMinRaw) : undefined
    if (priorityMinRaw !== undefined && Number.isNaN(priorityMin)) {
      ctx.status = 400
      ctx.body = { error: 'priority_min must be a number' }
      return
    }

    const filters: import('../types/keywordQueue.js').KeywordQueueListFilters =
      {}
    if (status) filters.status = status as KeywordQueueStatus
    if (city) filters.city = city
    if (priorityMin !== undefined) filters.priority_min = priorityMin

    const items = await service.list(filters)
    ctx.body = { items }
  }
)

/**
 * POST /api/ai-content/keyword-queue
 * Body: { items: Array<{ keyword, city?, priority?, targetUrl?, notes? }> }
 * Insert all and return inserted rows.
 */
router.post(
  '/keyword-queue',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(KeywordQueueService)
    const body = ctx.request.body as { items?: KeywordQueueInsertItem[] }

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      ctx.status = 400
      ctx.body = { error: 'items array is required' }
      return
    }

    if (body.items.length > 500) {
      ctx.status = 400
      ctx.body = { error: 'Maximum 500 keywords per request' }
      return
    }

    const invalid = body.items.find(
      (it) => !it || typeof it.keyword !== 'string' || it.keyword.trim() === ''
    )
    if (invalid) {
      ctx.status = 400
      ctx.body = { error: 'Each item must have a non-empty keyword string' }
      return
    }

    const inserted = await service.addMany(body.items)
    ctx.body = { items: inserted }
  }
)

/**
 * DELETE /api/ai-content/keyword-queue/:id
 */
router.delete(
  '/keyword-queue/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(KeywordQueueService)
    const id = ctx.params['id']
    if (!id) {
      ctx.status = 400
      ctx.body = { error: 'id is required' }
      return
    }

    const ok = await service.deleteById(id)
    if (!ok) {
      ctx.status = 404
      ctx.body = { error: 'Queue entry not found' }
      return
    }
    ctx.body = { ok: true }
  }
)

/**
 * POST /api/ai-content/keyword-queue/process
 * Body: { count?: number }  // default 5, server-capped at 20
 * Atomically claims next N pending items, generates a blog post per row
 * serially, and links the new blog id back to the queue entry.
 */
router.post(
  '/keyword-queue/process',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(KeywordQueueService)
    const body = (ctx.request.body || {}) as { count?: number }
    const requested = typeof body.count === 'number' ? body.count : 5
    if (!Number.isInteger(requested) || requested < 1) {
      ctx.status = 400
      ctx.body = { error: 'count must be a positive integer' }
      return
    }
    const count = Math.min(requested, 20)

    const authorEmail = ctx.state['user']?.email
    if (!authorEmail) {
      ctx.status = 401
      ctx.body = { error: 'Authenticated user email required' }
      return
    }

    const result = await service.processNext(count, authorEmail)
    ctx.body = result
  }
)

export default router
