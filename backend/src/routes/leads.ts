import Router from '@koa/router'
import { container } from 'tsyringe'
import { Middleware } from 'koa-jwt'
import { ApiError } from '../lib/errors.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import { LeadsService } from '../services/leads.js'
import type { LeadFilters } from '../types/lead.js'

const router = new Router({
  prefix: '/leads'
})

const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware = container.resolve<RoleMiddlewareCreator>('middleware.role')

// All routes require authentication and admin/agent role
router.use(authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Agent, UserRole.Root]))

function requireId(ctx: any): string | null {
  const id = ctx.params['id']
  if (!id) {
    ctx.throw(new ApiError('Id is required', { status: 400 }))
    return null
  }
  return id
}

// Get leads with filtering
router.get('/', async (ctx) => {
  const orgId = ctx.state['orgId']

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const {
    status,
    source,
    assigned_to,
    search,
    tags,
    limit = 20,
    offset = 0
  } = ctx.query

  const leadsService = ctx.state['container'].resolve(LeadsService)

  const filters: LeadFilters = {
    limit: Number(limit),
    offset: Number(offset)
  }
  if (status) filters.status = status as string
  if (source) filters.source = source as string
  if (assigned_to) filters.assigned_to = assigned_to as string
  if (search) filters.search = search as string
  if (tags) filters.tags = (typeof tags === 'string' ? [tags] : tags) as string[]

  const result = await leadsService.getLeads(orgId, filters)

  ctx.body = result
})

// Get lead statistics
router.get('/stats', async (ctx) => {
  const orgId = ctx.state['orgId']

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const stats = await leadsService.getStats(orgId)

  ctx.body = stats
})

// Get lead by ID
router.get('/:id', async (ctx) => {
  const orgId = ctx.state['orgId']
  const idParam = requireId(ctx)
  if (!idParam) return
  const id = BigInt(idParam)

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const lead = await leadsService.getLeadById(orgId, id)

  if (!lead) {
    ctx.throw(new ApiError('Lead not found', { status: 404 }))
    return
  }

  ctx.body = lead
})

// Create lead
router.post('/', async (ctx) => {
  const orgId = ctx.state['orgId']

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const lead = await leadsService.createLead(orgId, ctx.request.body as any)

  ctx.body = lead
})

// Update lead
router.patch('/:id', async (ctx) => {
  const orgId = ctx.state['orgId']
  const idParam = requireId(ctx)
  if (!idParam) return
  const id = BigInt(idParam)

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const lead = await leadsService.updateLead(orgId, id, ctx.request.body as any)

  ctx.body = lead
})

// Delete lead
router.delete('/:id', async (ctx) => {
  const orgId = ctx.state['orgId']
  const idParam = requireId(ctx)
  if (!idParam) return
  const id = BigInt(idParam)

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const success = await leadsService.deleteLead(orgId, id)

  ctx.body = { success }
})

// Get lead activities
router.get('/:id/activities', async (ctx) => {
  const orgId = ctx.state['orgId']
  const idParam = requireId(ctx)
  if (!idParam) return
  const id = BigInt(idParam)

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const activities = await leadsService.getActivities(orgId, id)

  ctx.body = activities
})

// Add activity to lead
router.post('/:id/activities', async (ctx) => {
  const orgId = ctx.state['orgId']
  const idParam = requireId(ctx)
  if (!idParam) return
  const id = BigInt(idParam)
  const performedBy = ctx.state['user']?.email

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const { activity_type, description, metadata } = ctx.request.body as {
    activity_type?: string
    description?: string
    metadata?: any
  }

  if (!activity_type) {
    ctx.throw(new ApiError('activity_type is required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const activityInput: { activity_type: string; description?: string; metadata?: any } = {
    activity_type
  }
  if (description !== undefined) activityInput.description = description
  if (metadata !== undefined) activityInput.metadata = metadata
  const activity = await leadsService.addActivity(
    orgId,
    id,
    activityInput,
    performedBy
  )

  ctx.body = activity
})

// Bulk update leads
router.post('/bulk/update', async (ctx) => {
  const orgId = ctx.state['orgId']

  if (!orgId) {
    ctx.throw(new ApiError('Organization context required', { status: 400 }))
    return
  }

  const { lead_ids, updates } = ctx.request.body as {
    lead_ids?: (string | number)[]
    updates?: any
  }

  if (!lead_ids || !Array.isArray(lead_ids)) {
    ctx.throw(new ApiError('lead_ids array is required', { status: 400 }))
    return
  }

  if (!updates) {
    ctx.throw(new ApiError('updates object is required', { status: 400 }))
    return
  }

  const leadsService = ctx.state['container'].resolve(LeadsService)
  const results = await leadsService.bulkUpdate(
    orgId,
    lead_ids.map((id) => BigInt(id)),
    updates
  )

  ctx.body = { updated: results.length, results }
})

export default router
