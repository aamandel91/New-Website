import Router from '@koa/router'
import { container } from 'tsyringe'
import { Middleware } from 'koa-jwt'
import { ApiError } from '../lib/errors.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import { OrganizationService } from '../services/organization.js'

const router = new Router({
  prefix: '/organization'
})

const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware = container.resolve<RoleMiddlewareCreator>('middleware.role')

// Public route - resolve organization by hostname
router.get('/resolve', async (ctx) => {
  const hostname = ctx.request.hostname
  const orgService = ctx.state.container.resolve(OrganizationService)

  const organization = await orgService.resolveOrganizationByHostname(hostname)

  if (!organization) {
    ctx.throw(new ApiError('Organization not found', { status: 404 }))
    return
  }

  ctx.body = organization
})

// Protected routes require authentication
router.use(authMiddleware)

// Get current organization (based on user's org)
router.get('/current', async (ctx) => {
  const orgId = ctx.state.orgId // Set by tenant context middleware

  if (!orgId) {
    ctx.throw(new ApiError('Organization context not found', { status: 400 }))
    return
  }

  const orgService = ctx.state.container.resolve(OrganizationService)
  const organization = await orgService.getOrganization(orgId)

  if (!organization) {
    ctx.throw(new ApiError('Organization not found', { status: 404 }))
    return
  }

  ctx.body = organization
})

// Get organization by ID
router.get('/:id', async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const orgService = ctx.state.container.resolve(OrganizationService)

  const organization = await orgService.getOrganization(orgId)

  if (!organization) {
    ctx.throw(new ApiError('Organization not found', { status: 404 }))
    return
  }

  ctx.body = organization
})

// Update organization (admin/owner only)
router.patch('/:id', roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const orgService = ctx.state.container.resolve(OrganizationService)

  // Validate input
  const { name, plan, status, settings, primary_domain, custom_domain, logo_cloudinary_id, primary_color, secondary_color, contact_email, contact_phone } = ctx.request.body

  const organization = await orgService.updateOrganization(orgId, {
    name,
    plan,
    status,
    settings,
    primary_domain,
    custom_domain,
    logo_cloudinary_id,
    primary_color,
    secondary_color,
    contact_email,
    contact_phone
  })

  ctx.body = organization
})

// Get organization members
router.get('/:id/members', async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const orgService = ctx.state.container.resolve(OrganizationService)

  const members = await orgService.getMembers(orgId)
  ctx.body = members
})

// Add member to organization (admin/owner only)
router.post('/:id/members', roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const { email, role } = ctx.request.body

  if (!email || !role) {
    ctx.throw(new ApiError('email and role are required', { status: 400 }))
    return
  }

  const invitedBy = ctx.state.user?.email
  const orgService = ctx.state.container.resolve(OrganizationService)

  const member = await orgService.addMember(orgId, email, role, invitedBy)
  ctx.body = member
})

// Update member role (admin/owner only)
router.patch('/:id/members/:email', roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const email = ctx.params.email
  const { role } = ctx.request.body

  if (!role) {
    ctx.throw(new ApiError('role is required', { status: 400 }))
    return
  }

  const orgService = ctx.state.container.resolve(OrganizationService)
  const member = await orgService.updateMemberRole(orgId, email, role)

  ctx.body = member
})

// Remove member from organization (admin/owner only)
router.delete('/:id/members/:email', roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const email = ctx.params.email

  const orgService = ctx.state.container.resolve(OrganizationService)
  const success = await orgService.removeMember(orgId, email)

  ctx.body = { success }
})

// Create invitation (admin/owner only)
router.post('/:id/invitations', roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const { email, role } = ctx.request.body

  if (!email || !role) {
    ctx.throw(new ApiError('email and role are required', { status: 400 }))
    return
  }

  const invitedBy = ctx.state.user?.email
  const orgService = ctx.state.container.resolve(OrganizationService)

  const invitation = await orgService.createInvitation(orgId, email, role, invitedBy)
  ctx.body = invitation
})

// Accept invitation (public with token)
router.post('/invitations/:token/accept', async (ctx) => {
  const token = ctx.params.token
  const userEmail = ctx.state.user?.email

  if (!userEmail) {
    ctx.throw(new ApiError('User email not found', { status: 401 }))
    return
  }

  const orgService = ctx.state.container.resolve(OrganizationService)
  const result = await orgService.acceptInvitation(token, userEmail)

  ctx.body = result
})

// Get agents with subdomains
router.get('/:id/agents/subdomains', async (ctx) => {
  const orgId = BigInt(ctx.params.id)

  const orgService = ctx.state.container.resolve(OrganizationService)
  const agents = await orgService.getAgentSubdomains(orgId)

  ctx.body = agents
})

// Find agent by subdomain
router.get('/:id/agents/subdomain/:subdomain', async (ctx) => {
  const orgId = BigInt(ctx.params.id)
  const subdomain = ctx.params.subdomain

  const orgService = ctx.state.container.resolve(OrganizationService)
  const agent = await orgService.findAgentBySubdomain(orgId, subdomain)

  if (!agent) {
    ctx.throw(new ApiError('Agent not found', { status: 404 }))
    return
  }

  ctx.body = agent
})

export default router
