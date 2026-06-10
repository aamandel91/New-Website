import Router from '@koa/router'
import joi from 'joi'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { SeoMetaTemplatesService } from '../services/seoMetaTemplates.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import { SEO_PAGE_TYPES, type SeoPageType } from '../types/seoMetaTemplates.js'

const router = new Router({
  prefix: '/seo-meta-templates'
})
const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware =
  container.resolve<RoleMiddlewareCreator>('middleware.role')

const adminOnly = [
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root])
]

const upsertSchema = joi.object({
  pageType: joi
    .string()
    .valid(...SEO_PAGE_TYPES)
    .required(),
  titleTemplate: joi.string().min(1).max(500).required(),
  descriptionTemplate: joi.string().min(1).max(2000).required(),
  enabled: joi.boolean().optional()
})

function isValidPageType(value: unknown): value is SeoPageType {
  return (
    typeof value === 'string' && (SEO_PAGE_TYPES as string[]).includes(value)
  )
}

/**
 * GET /api/seo-meta-templates
 * Admin: list all templates (one row per page type).
 */
router.get('/', ...adminOnly, async (ctx) => {
  const service = ctx.state['container'].resolve(SeoMetaTemplatesService)
  const templates = await service.getAll()
  ctx.body = { templates }
})

/**
 * GET /api/seo-meta-templates/page-type/:pageType
 * Public: needed by the metadata generation pipeline. Reads only.
 */
router.get('/page-type/:pageType', async (ctx) => {
  const { pageType } = ctx.params
  if (!isValidPageType(pageType)) {
    ctx.status = 400
    ctx.body = { error: 'Invalid pageType' }
    return
  }
  const service = ctx.state['container'].resolve(SeoMetaTemplatesService)
  const template = await service.getByPageType(pageType)
  if (!template) {
    ctx.status = 404
    ctx.body = { error: 'Template not found' }
    return
  }
  ctx.body = { template }
})

/**
 * POST /api/seo-meta-templates
 * Admin: create or update a page-type template.
 */
router.post('/', ...adminOnly, async (ctx) => {
  const { error, value } = upsertSchema.validate(ctx.request.body)
  if (error) {
    ctx.status = 400
    ctx.body = { error: error.message }
    return
  }
  const userId = ctx.state['userId'] ? Number(ctx.state['userId']) : undefined
  const service = ctx.state['container'].resolve(SeoMetaTemplatesService)
  const template = await service.upsert(
    value.pageType,
    {
      titleTemplate: value.titleTemplate,
      descriptionTemplate: value.descriptionTemplate,
      enabled: value.enabled
    },
    userId
  )
  ctx.body = { template }
})

/**
 * DELETE /api/seo-meta-templates/:pageType
 * Admin: reset a page-type template to its seeded default. We don't actually
 * delete the row — we overwrite it with the original defaults so the API
 * shape stays consistent for the rendering pipeline.
 */
router.delete('/:pageType', ...adminOnly, async (ctx) => {
  const { pageType } = ctx.params
  if (!isValidPageType(pageType)) {
    ctx.status = 400
    ctx.body = { error: 'Invalid pageType' }
    return
  }
  const service = ctx.state['container'].resolve(SeoMetaTemplatesService)
  const template = await service.resetToDefault(pageType)
  ctx.body = { template }
})

/**
 * GET /api/seo-meta-templates/preview/:pageType
 * Admin: returns the currently saved template rendered against the page-type
 * sample data. Used by the admin preview pane.
 */
router.get('/preview/:pageType', ...adminOnly, async (ctx) => {
  const { pageType } = ctx.params
  if (!isValidPageType(pageType)) {
    ctx.status = 400
    ctx.body = { error: 'Invalid pageType' }
    return
  }
  const service = ctx.state['container'].resolve(SeoMetaTemplatesService)
  const preview = await service.preview(pageType)
  ctx.body = { preview }
})

/**
 * POST /api/seo-meta-templates/preview/:pageType
 * Admin: render arbitrary title/description templates against the sample
 * data without saving. Used by the live preview pane while typing.
 */
const livePreviewSchema = joi.object({
  titleTemplate: joi.string().allow('').max(500).required(),
  descriptionTemplate: joi.string().allow('').max(2000).required()
})

router.post('/preview/:pageType', ...adminOnly, async (ctx) => {
  const { pageType } = ctx.params
  if (!isValidPageType(pageType)) {
    ctx.status = 400
    ctx.body = { error: 'Invalid pageType' }
    return
  }
  const { error, value } = livePreviewSchema.validate(ctx.request.body)
  if (error) {
    ctx.status = 400
    ctx.body = { error: error.message }
    return
  }
  const service = ctx.state['container'].resolve(SeoMetaTemplatesService)
  const context = await service.getSampleContextForPageType(pageType)
  const title = service.resolveTemplate(value.titleTemplate, context)
  const description = service.resolveTemplate(
    value.descriptionTemplate,
    context
  )
  ctx.body = { preview: { title, description, context } }
})

export default router
