import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { NavigationService } from '../services/navigation.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import type {
  CreateNavigationItemInput,
  UpdateNavigationItemInput,
  NavigationFilters
} from '../types/navigation.js'

const router = new Router({
  prefix: '/navigation'
})
const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware =
  container.resolve<RoleMiddlewareCreator>('middleware.role')

function requireId(ctx: any): string | null {
  const id = ctx.params['id']
  if (!id) {
    ctx.status = 400
    ctx.body = { error: 'Id is required' }
    return null
  }
  return id
}

/**
 * GET /api/navigation
 * Get all navigation items with optional filters
 */
router.get('/', async (ctx) => {
  const service = ctx.state['container'].resolve(NavigationService)
  const orgId = ctx.state['orgId']

  const filters: NavigationFilters = {}

  if (ctx.query['position']) {
    filters.position = ctx.query['position'] as string
  }

  if (ctx.query['is_visible'] !== undefined) {
    filters.visible = ctx.query['is_visible'] === 'true'
  }

  const items = await service.getItems(orgId, filters)
  ctx.body = { items }
})

/**
 * GET /api/navigation/:id
 * Get navigation item by ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
    const idParam = requireId(ctx)
    if (!idParam) return
    const id = BigInt(idParam)

    const item = await service.getItemById(orgId, id)

    if (!item) {
      ctx.status = 404
      ctx.body = { error: 'Navigation item not found' }
      return
    }

    ctx.body = { item }
  }
)

/**
 * POST /api/navigation
 * Create a new navigation item
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
    const input = ctx.request.body as CreateNavigationItemInput

    const item = await service.createItem(orgId, input)
    ctx.status = 201
    ctx.body = { item }
  }
)

/**
 * PATCH /api/navigation/:id
 * Update a navigation item
 */
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
    const idParam = requireId(ctx)
    if (!idParam) return
    const id = BigInt(idParam)
    const input = ctx.request.body as UpdateNavigationItemInput

    const item = await service.updateItem(orgId, id, input)
    ctx.body = { item }
  }
)

/**
 * DELETE /api/navigation/:id
 * Delete a navigation item
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
    const idParam = requireId(ctx)
    if (!idParam) return
    const id = BigInt(idParam)

    const success = await service.deleteItem(orgId, id)
    ctx.body = { success }
  }
)

/**
 * POST /api/navigation/reorder
 * Reorder navigation items
 */
router.post(
  '/reorder',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
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
  }
)

/**
 * POST /api/navigation/:id/duplicate
 * Duplicate a navigation item
 */
router.post(
  '/:id/duplicate',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
    const idParam = requireId(ctx)
    if (!idParam) return
    const id = BigInt(idParam)

    const item = await service.duplicateItem(orgId, id)
    ctx.status = 201
    ctx.body = { item }
  }
)

/**
 * POST /api/navigation/:id/toggle-visibility
 * Toggle visibility of a navigation item
 */
router.post(
  '/:id/toggle-visibility',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const service = ctx.state['container'].resolve(NavigationService)
    const orgId = ctx.state['orgId']
    const idParam = requireId(ctx)
    if (!idParam) return
    const id = BigInt(idParam)

    const item = await service.toggleVisibility(orgId, id)
    ctx.body = { item }
  }
)

export default router
