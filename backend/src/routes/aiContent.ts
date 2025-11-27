import Router from '@koa/router'
import { Context } from 'koa'
import { AIContentService } from '../services/aiContent.js'
import { BulkPageGenerationService } from '../services/bulkPageGeneration.js'
import { requireAuth } from '../providers/middleware/auth.js'
import { requireAdmin } from '../providers/middleware/adminRole.js'
import type {
  AIBlogPostRequest,
  AIPageContentRequest,
  BulkPageGenerationRequest
} from '../types/aiContent.js'

const router = new Router({
  prefix: '/ai-content'
})

/**
 * POST /api/ai-content/blog
 * Generate a blog post with AI
 */
router.post('/blog', requireAuth, requireAdmin, async (ctx: Context) => {
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
router.post('/keywords', requireAuth, requireAdmin, async (ctx: Context) => {
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
router.post('/page', requireAuth, requireAdmin, async (ctx: Context) => {
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
router.post('/batch', requireAuth, requireAdmin, async (ctx: Context) => {
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
router.post('/bulk-pages/preview', requireAuth, requireAdmin, async (ctx: Context) => {
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
router.post('/bulk-pages/generate', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(BulkPageGenerationService)
  const orgId = ctx.state.orgId
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

export default router
