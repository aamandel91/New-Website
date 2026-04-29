import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { ContentPagesService } from '../services/contentPages.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import type {
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPageFilters
} from '../types/contentPage.js'

const router = new Router({
  prefix: '/content-pages'
})
const authMiddleware = container.resolve<Middleware>("middleware.jwt")
const roleMiddleware = container.resolve<RoleMiddlewareCreator>("middleware.role")

function requireParam(ctx: any, name: string): string | null {
  const value = ctx.params[name]
  if (!value) {
    ctx.status = 400
    ctx.body = { error: `${name} is required` }
    return null
  }
  return value
}

/**
 * GET /api/content-pages
 * Get all content pages with optional filters
 */
router.get('/', authMiddleware, async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']

  const filters: ContentPageFilters = {
    status: ctx.query['status'] as string,
    is_template: ctx.query['is_template'] === 'true'
  }

  const pages = await service.getPages(orgId, filters)
  ctx.body = { pages }
})

/**
 * GET /api/content-pages/templates
 * Get all page templates
 */
router.get('/templates', authMiddleware, async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']

  const templates = await service.getTemplates(orgId)
  ctx.body = { templates }
})

/**
 * GET /api/content-pages/slug/:slug
 * Get page by slug
 */
router.get('/slug/:slug', async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const slug = requireParam(ctx, 'slug')
  if (!slug) return

  const page = await service.getPageBySlug(orgId, slug)

  if (!page) {
    ctx.status = 404
    ctx.body = { error: 'Page not found' }
    return
  }

  ctx.body = { page }
})

/**
 * GET /api/content-pages/:id
 * Get page by ID
 */
router.get('/:id', authMiddleware, async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const idParam = requireParam(ctx, 'id')
  if (!idParam) return
  const id = BigInt(idParam)

  const page = await service.getPageById(orgId, id)

  if (!page) {
    ctx.status = 404
    ctx.body = { error: 'Page not found' }
    return
  }

  ctx.body = { page }
})

/**
 * POST /api/content-pages
 * Create a new page
 */
router.post('/', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const input = ctx.request.body as CreateContentPageInput

  const page = await service.createPage(orgId, input)
  ctx.status = 201
  ctx.body = { page }
})

/**
 * PATCH /api/content-pages/:id
 * Update a page
 */
router.patch('/:id', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const idParam = requireParam(ctx, 'id')
  if (!idParam) return
  const id = BigInt(idParam)
  const input = ctx.request.body as UpdateContentPageInput

  const page = await service.updatePage(orgId, id, input)
  ctx.body = { page }
})

/**
 * DELETE /api/content-pages/:id
 * Delete a page
 */
router.delete('/:id', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const idParam = requireParam(ctx, 'id')
  if (!idParam) return
  const id = BigInt(idParam)

  const success = await service.deletePage(orgId, id)
  ctx.body = { success }
})

/**
 * POST /api/content-pages/:id/publish
 * Publish a page
 */
router.post('/:id/publish', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const idParam = requireParam(ctx, 'id')
  if (!idParam) return
  const id = BigInt(idParam)

  const page = await service.publishPage(orgId, id)
  ctx.body = { page }
})

/**
 * POST /api/content-pages/:id/duplicate
 * Duplicate a page from template
 */
router.post('/:id/duplicate', authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const service = ctx.state['container'].resolve(ContentPagesService)
  const orgId = ctx.state['orgId']
  const idParam = requireParam(ctx, 'id')
  if (!idParam) return
  const templateId = BigInt(idParam)
  const { title } = ctx.request.body as { title: string }

  if (!title) {
    ctx.status = 400
    ctx.body = { error: 'Title is required' }
    return
  }

  const page = await service.duplicateFromTemplate(orgId, templateId, title)
  ctx.status = 201
  ctx.body = { page }
})

export default router
