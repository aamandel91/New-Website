import crypto from 'node:crypto'
import { promisify } from 'node:util'
import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import type { Knex } from 'knex'
import { ApiError } from '../lib/errors.js'
import type { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'
import AdminService from '../services/admin.js'
import AdminSettingsService from '../services/adminSettings.js'
import {
  adminCreateAgentBatchSchema,
  adminUpdateAgentSchema,
  adminGetAgentsSchema
} from '../validate/admin.js'

const scryptAsync = promisify(crypto.scrypt)
const router = new Router({
  prefix: '/admin'
})
const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware =
  container.resolve<RoleMiddlewareCreator>('middleware.role')
router.use(authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]))
router.get('/agents', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = adminGetAgentsSchema.validate({
    ...ctx.request.query
  })
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const adminService = ctx.state.container.resolve(AdminService)
  ctx.body = await adminService.getAgents(value)
})
router.post('/agents', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = adminCreateAgentBatchSchema.validate([
    ...ctx.request.body
  ])
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const adminService = ctx.state.container.resolve(AdminService)
  ctx.body = await adminService.createAgentsBatch(value)
})
router.patch('/agents/:agentId', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = adminUpdateAgentSchema.validate({
    ...ctx.request.body,
    agentId: ctx.params['agentId']
  })
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const adminService = ctx.state.container.resolve(AdminService)
  ctx.body = await adminService.updateAgent(value)
})

// Admin Settings endpoints
router.get('/settings', async (ctx) => {
  const adminSettingsService = ctx.state.container.resolve(AdminSettingsService)
  ctx.body = await adminSettingsService.getAllSettings()
})

router.get('/settings/:key', async (ctx) => {
  const adminSettingsService =
    ctx.state['container'].resolve(AdminSettingsService)
  const key = ctx.params['key']
  if (!key) {
    ctx.throw(new ApiError('Key is required', 400))
    return
  }
  const setting = await adminSettingsService.getSetting(key)
  if (!setting) {
    ctx.throw(new ApiError('Setting not found', 404))
    return
  }
  ctx.body = setting
})

router.patch('/settings/:key', async (ctx) => {
  const adminSettingsService =
    ctx.state['container'].resolve(AdminSettingsService)
  const { value } = ctx.request.body as { value?: any }
  if (value === undefined) {
    ctx.throw(new ApiError('Value is required', 400))
    return
  }
  const userEmail = ctx.state['user']?.email
  const key = ctx.params['key']
  if (!key) {
    ctx.throw(new ApiError('Key is required', 400))
    return
  }
  ctx.body = await adminSettingsService.updateSetting(key, value, userEmail)
})

// Specific PPC settings endpoints
router.get('/settings/ppc/registration', async (ctx) => {
  const adminSettingsService = ctx.state.container.resolve(AdminSettingsService)
  ctx.body = await adminSettingsService.getPpcRegistrationSettings()
})

router.patch('/settings/ppc/registration', async (ctx) => {
  const adminSettingsService =
    ctx.state['container'].resolve(AdminSettingsService)
  const { enabled, sources, viewThreshold } = ctx.request.body as {
    enabled?: boolean
    sources?: any
    viewThreshold?: number
  }
  if (enabled === undefined || !sources || viewThreshold === undefined) {
    ctx.throw(
      new ApiError('enabled, sources, and viewThreshold are required', 400)
    )
    return
  }
  const userEmail = ctx.state['user']?.email
  ctx.body = await adminSettingsService.updatePpcRegistrationSettings(
    { enabled, sources, viewThreshold },
    userEmail
  )
})

router.get('/settings/organic/registration', async (ctx) => {
  const adminSettingsService = ctx.state.container.resolve(AdminSettingsService)
  ctx.body = await adminSettingsService.getOrganicRegistrationSettings()
})

router.patch('/settings/organic/registration', async (ctx) => {
  const adminSettingsService =
    ctx.state['container'].resolve(AdminSettingsService)
  const { enabled, viewThreshold } = ctx.request.body as {
    enabled?: boolean
    viewThreshold?: number
  }
  if (enabled === undefined || viewThreshold === undefined) {
    ctx.throw(new ApiError('enabled and viewThreshold are required', 400))
    return
  }
  const userEmail = ctx.state['user']?.email
  ctx.body = await adminSettingsService.updateOrganicRegistrationSettings(
    { enabled, viewThreshold },
    userEmail
  )
})

// Admin Users Management
router.get('/users', async (ctx) => {
  const db = ctx.state.container.resolve<Knex>('db')
  const users = await db('admin_users')
    .select(
      'id',
      'email',
      'first_name',
      'last_name',
      'role',
      'created_at',
      'updated_at'
    )
    .orderBy('created_at', 'desc')
  ctx.body = users
})

router.post('/users', async (ctx) => {
  const { email, password, first_name, last_name, role } = ctx.request.body as {
    email?: string
    password?: string
    first_name?: string
    last_name?: string
    role?: string
  }
  if (!email || !password) {
    ctx.throw(new ApiError('Email and password are required', 400))
    return
  }
  const db = ctx.state.container.resolve<Knex>('db')
  const existing = await db('admin_users')
    .where({ email: email.toLowerCase() })
    .first()
  if (existing) {
    ctx.throw(new ApiError('User with this email already exists', 409))
    return
  }
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  const passwordHash = `${salt}:${derived.toString('hex')}`
  const [user] = await db('admin_users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: first_name || null,
      last_name: last_name || null,
      role: role || 'admin'
    })
    .returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at'])
  ctx.status = 201
  ctx.body = user
})

router.patch('/users/:id', async (ctx) => {
  const { id } = ctx.params
  const { email, password, first_name, last_name, role } = ctx.request.body as {
    email?: string
    password?: string
    first_name?: string
    last_name?: string
    role?: string
  }
  const db = ctx.state.container.resolve<Knex>('db')
  const updates: Record<string, unknown> = { updated_at: db.fn.now() }
  if (email) updates['email'] = email.toLowerCase()
  if (first_name !== undefined) updates['first_name'] = first_name
  if (last_name !== undefined) updates['last_name'] = last_name
  if (role) updates['role'] = role
  if (password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const derived = (await scryptAsync(password, salt, 64)) as Buffer
    updates['password_hash'] = `${salt}:${derived.toString('hex')}`
  }
  const [user] = await db('admin_users')
    .where({ id })
    .update(updates)
    .returning([
      'id',
      'email',
      'first_name',
      'last_name',
      'role',
      'created_at',
      'updated_at'
    ])
  if (!user) {
    ctx.throw(new ApiError('User not found', 404))
    return
  }
  ctx.body = user
})

router.delete('/users/:id', async (ctx) => {
  const { id } = ctx.params
  const db = ctx.state.container.resolve<Knex>('db')
  const deleted = await db('admin_users').where({ id }).del()
  if (!deleted) {
    ctx.throw(new ApiError('User not found', 404))
    return
  }
  ctx.body = { result: true }
})

export default router
