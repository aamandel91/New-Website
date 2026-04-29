import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { AIContentService } from '../services/aiContent.js'
import { BulkPageGenerationService } from '../services/bulkPageGeneration.js'
import { RepliersLocationsService } from '../services/repliersLocations.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import type {
  AIBlogPostRequest,
  AIPageContentRequest,
  BulkPageGenerationRequest
} from '../types/aiContent.js'

const router = new Router({
  prefix: '/ai-content'
})
const authMiddleware = container.resolve<Middleware>("middleware.jwt")
const roleMiddleware = container.resolve<RoleMiddlewareCreator>("middleware.role")

/**
 * POST /api/ai-content/blog
 * Generate a blog post with AI
 */
router.post('/blog', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state.container.resolve(AIContentService)
  const request = ctx.request.body as AIBlogPostRequest

  if (!request.keyword) {
    ctx.status = 400
    ctx.body = { error: 'Keyword is required' }
    return
  }

  const result = await service.generateBlogPost(request)
  ctx.body = result
})

/**
 * POST /api/ai-content/keywords
 * Suggest keywords for a topic
 */
router.post('/keywords', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state.container.resolve(AIContentService)
  const { topic, city } = ctx.request.body as { topic: string; city?: string }

  if (!topic) {
    ctx.status = 400
    ctx.body = { error: 'Topic is required' }
    return
  }

  const keywords = await service.suggestKeywords(topic, city)
  ctx.body = { keywords }
})

/**
 * POST /api/ai-content/page
 * Generate page content with AI
 */
router.post('/page', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state.container.resolve(AIContentService)
  const request = ctx.request.body as AIPageContentRequest

  if (!request.pageType || !request.keyword) {
    ctx.status = 400
    ctx.body = { error: 'Page type and keyword are required' }
    return
  }

  const result = await service.generatePageContent(request)
  ctx.body = result
})

/**
 * POST /api/ai-content/batch
 * Generate multiple pages with AI
 */
router.post('/batch', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state.container.resolve(AIContentService)
  const { requests } = ctx.request.body as { requests: AIPageContentRequest[] }

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
})

/**
 * POST /api/ai-content/bulk-pages/preview
 * Preview bulk page generation
 */
router.post('/bulk-pages/preview', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state.container.resolve(BulkPageGenerationService)
  const request = ctx.request.body as BulkPageGenerationRequest

  if (!request.pageType || !request.selectedIds || request.selectedIds.length === 0) {
    ctx.status = 400
    ctx.body = { error: 'Page type and selected IDs are required' }
    return
  }

  const preview = await service.previewPages(request)
  ctx.body = { preview }
})

/**
 * POST /api/ai-content/bulk-pages/generate
 * Generate pages in bulk
 */
router.post('/bulk-pages/generate', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state['container'].resolve(BulkPageGenerationService)
  const orgId = ctx.state['orgId']
  const request = ctx.request.body as BulkPageGenerationRequest

  if (!request.pageType || !request.selectedIds || request.selectedIds.length === 0) {
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
})

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

export default router
