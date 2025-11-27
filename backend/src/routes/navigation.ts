import Router from '@koa/router'
import { Context } from 'koa'
import { NavigationService } from '../services/navigation.js'
import { requireAuth } from '../providers/middleware/auth.js'
import { requireAdmin } from '../providers/middleware/adminRole.js'
import type {
  CreateNavigationItemInput,
  UpdateNavigationItemInput,
  NavigationFilters
} from '../types/navigation.js'

const router = new Router({
  prefix: '/navigation'
})

/**
 * GET /api/navigation
 * Get all navigation items with optional filters
 */
router.get('/', async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId

  const filters: NavigationFilters = {}

  if (ctx.query.position) {
    filters.position = ctx.query.position as string
  }

  if (ctx.query.is_visible !== undefined) {
    filters.is_visible = ctx.query.is_visible === 'true'
  }

  const items = await service.getItems(orgId, filters)
  ctx.body = { items }
})

/**
 * GET /api/navigation/:id
 * Get navigation item by ID
 */
router.get('/:id', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const id = BigInt(ctx.params.id)

  const item = await service.getItemById(orgId, id)

  if (!item) {
    ctx.status = 404
    ctx.body = { error: 'Navigation item not found' }
    return
  }

  ctx.body = { item }
})

/**
 * POST /api/navigation
 * Create a new navigation item
 */
router.post('/', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const input = ctx.request.body as CreateNavigationItemInput

  const item = await service.createItem(orgId, input)
  ctx.status = 201
  ctx.body = { item }
})

/**
 * PATCH /api/navigation/:id
 * Update a navigation item
 */
router.patch('/:id', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const id = BigInt(ctx.params.id)
  const input = ctx.request.body as UpdateNavigationItemInput

  const item = await service.updateItem(orgId, id, input)
  ctx.body = { item }
})

/**
 * DELETE /api/navigation/:id
 * Delete a navigation item
 */
router.delete('/:id', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const id = BigInt(ctx.params.id)

  const success = await service.deleteItem(orgId, id)
  ctx.body = { success }
})

/**
 * POST /api/navigation/reorder
 * Reorder navigation items
 */
router.post('/reorder', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const { position, itemIds } = ctx.request.body as {
    position: string
    itemIds: string[]
  }

  if (!position || !itemIds || !Array.isArray(itemIds)) {
    ctx.status = 400
    ctx.body = { error: 'Position and itemIds array are required' }
    return
  }

  const items = await service.reorderItems(
    orgId,
    position,
    itemIds.map((id) => BigInt(id))
  )
  ctx.body = { items }
})

/**
 * POST /api/navigation/:id/duplicate
 * Duplicate a navigation item
 */
router.post('/:id/duplicate', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const id = BigInt(ctx.params.id)

  const item = await service.duplicateItem(orgId, id)
  ctx.status = 201
  ctx.body = { item }
})

/**
 * POST /api/navigation/:id/toggle-visibility
 * Toggle visibility of a navigation item
 */
router.post('/:id/toggle-visibility', requireAuth, requireAdmin, async (ctx: Context) => {
  const service = ctx.state.container.resolve(NavigationService)
  const orgId = ctx.state.orgId
  const id = BigInt(ctx.params.id)

  const item = await service.toggleVisibility(orgId, id)
  ctx.body = { item }
})

export default router
