import crypto from 'node:crypto'
import { promisify } from 'node:util'
import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import type { Knex } from 'knex'
import AuthService from '../services/auth.js'
import { ApiError } from '../lib/errors.js'
import {
  authEmbedSchema,
  authRepliersTokenSchema,
  userLoginSchema,
  userOtpSchema,
  userSignupSchema
} from '../validate/auth.js'
import OAuthService from '../services/oauth.js'
import { oauthUrlSchema } from '../validate/oauth.js'
import { UserRole } from '../constants.js'

const scryptAsync = promisify(crypto.scrypt)
const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const router = new Router({
  prefix: '/auth'
})
router.param('provider', (provider, ctx, next) => {
  const { error, value } = oauthUrlSchema.validate({
    provider
  })
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  ctx['provider'] = value.provider
  return next()
})

/**
 * @openapi
 * /api/auth/{provider}/url:
 *    get:
 *       tags:
 *          - Auth
 *       summary: Return url for google-based oAuth flow
 *       parameters:
 *          - in: path
 *            name: provider
 *            schema:
 *               type: string
 *               enum: ['google', 'facebook']
 *            description: |
 *               Type of authentication provider to generate auth url for
 *
 *       responses:
 *          200:
 *             description: url for redirect
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         url:
 *                            type: string
 *                            format: uri
 *                            example: https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=...&access_type=offline&scope=...&include_granted_scopes=true&response_type=code&client_id=...
 */
router.get('/:provider/url', async (ctx) => {
  const oAuthService = ctx.state.container.resolve(OAuthService)
  const url = await oAuthService.url(ctx['provider'])
  ctx.body = {
    url
  }
})

/**
 * @openapi
 * /api/auth/{provider}/cb:
 *    post:
 *       tags:
 *          - Auth
 *       summary: authorize user via oauth provider and return JWT token
 *       parameters:
 *          - in: path
 *            name: provider
 *            schema:
 *               type: string
 *               enum: ['google', 'facebook']
 *            description: |
 *               Type of authentication provider to generate auth url for
 *       description: Frontend should proxy all params passed from google to this endpoint to get JWT token
 *       requestBody:
 *          description: all params passed to redirect_url as query params but in body including code and extra url if it was used on /google/url request
 *          content:
 *             application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                      code:
 *                         type: string
 *                      url:
 *                         type: string
 *                         format: uri
 *                         description: Should be the same url (or undefined) as used in GET /google/url request
 *                   required: [code]
 *       responses:
 *          200:
 *             description: jwt token
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         token:
 *                            type: string
 *                         profile:
 *                            type: object
 *                            properties:
 *                               first_name:
 *                                  type: string
 *                               last_name:
 *                                  type: string
 *                               picture:
 *                                  type: string
 *
 */
router.post('/:provider/cb', async (ctx) => {
  const oAuthService = ctx.state.container.resolve(OAuthService)
  const { token, profile } = await oAuthService.callback(
    ctx['provider'],
    ctx.req
  )
  ctx.body = {
    token,
    profile
  }
})

/**
 * @openapi
 * components:
 *    schemas:
 *       UserProfile:
 *          type: object
 *          properties:
 *             clientId: string
 * /api/auth/login:
 *    post:
 *       tags:
 *          - Auth
 *       requestBody:
 *          description: Email / phone for OTP login
 *          required: true
 *          content:
 *             application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                      email:
 *                         $ref: '#/components/schemas/email'
 *                      phone:
 *                        type: string
 *       summary: User login
 *       description: Will return static true
 *       responses:
 *          200:
 *             description: sends OTP code to corresponding email / phone
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         result:
 *                            type: boolean
 *          400:
 *             $ref: '#/components/responses/BadRequest'
 */
router.post('/login', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = userLoginSchema.validate(ctx.request.body)
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const authService = ctx.state.container.resolve(AuthService)
  const maybeCode = await authService.login(value)
  ctx.body = {
    result: true,
    ...maybeCode
  }
})

/**
 * @openapi
 * /api/auth/otp:
 *    post:
 *       tags:
 *          - Auth
 *       requestBody:
 *          description: OTP code for authorisation
 *          required: true
 *          content:
 *             application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                      code:
 *                        type: string
 *                   required: [code]
 *       summary: Consume OTP code to login
 *       description: Will return JWT token
 *       responses:
 *          200:
 *             description: Returns temp OTP token associated with user account
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         token:
 *                            type: string
 *                         profile:
 *                            type: object
 *                            unknown: true
 *          400:
 *             $ref: '#/components/responses/BadRequest'
 *          403:
 *             $ref: '#/components/responses/Forbidden'
 */
router.post('/otp', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = userOtpSchema.validate(ctx.request.body)
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const authService = ctx.state.container.resolve(AuthService)
  const { token, profile } = await authService.useOtp(value)
  ctx.body = {
    token,
    profile
  }
})

/**
 * @openapi
 * /api/auth/refresh:
 *    post:
 *       tags:
 *          - Auth
 *       summary: Refresh previous token
 *       description: Refreshed token will have same expiration period as supplied
 *       responses:
 *          200:
 *             description: Returns jwt token associated with user account
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         token:
 *                            type: string
 *          401:
 *             $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', authMiddleware, async (ctx) => {
  const authService = ctx.state.container.resolve(AuthService)
  const { token } = await authService.refresh(ctx.state['user'])
  ctx.body = {
    token
  }
})

/**
 * @openapi
 * /api/auth/logout:
 *    post:
 *       tags:
 *          - Auth
 *       summary: Revoke jwt token
 *       description: Token will remain revoked until its expiration time happens
 *       responses:
 *          200:
 *             description: Return true if key was succesfully removed
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         result:
 *                            type: boolean
 *          401:
 *             $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authMiddleware, async (ctx) => {
  const authService = ctx.state.container.resolve(AuthService)
  await authService.logout(ctx.state['user'].jti, ctx.state['user'].exp)
  ctx.body = {
    result: true
  }
})

/**
 * @openapi
 * /api/auth/signup:
 *    post:
 *       tags:
 *          - Auth
 *       summary: Signup user and sends verification email
 *       description:
 *       responses:
 *          200:
 *             description: Return true if key was succesfully removed
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         result:
 *                            type: boolean
 *          401:
 *             $ref: '#/components/responses/Unauthorized'
 *          400:
 *             description: Validation error, in case validation fails on Auth0 side will include additional "info" key
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         message:
 *                            type: string
 *                         info:
 *                            type: object
 *                            properties:
 *                               message:
 *                                  type: string
 *                      required: [message]
 */
router.post('/signup', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = userSignupSchema.validate({
    ...ctx.request.body,
    referer: ctx.request.headers['referer']
  })
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const authService = ctx.state.container.resolve(AuthService)
  const maybeCode = await authService.signup(value)
  ctx.body = {
    result: true,
    ...maybeCode
  }
})

/**
 * @openapi
 * /api/auth/repliers-token:
 *    post:
 *       tags:
 *          - Auth
 *       summary: Exchange repliers token for JWT token
 *       requestBody:
 *          description: Repliers token
 *          content:
 *             application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                      token:
 *                        type: string
 *                   required: [token]
 *       responses:
 *          200:
 *             description: Returns temp JWT token associated with user account and user profile
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         token:
 *                            type: string
 *                         profile:
 *                            type: object
 *                            unknown: true
 *
 *          400:
 *             $ref: '#/components/responses/BadRequest'
 *          403:
 *             $ref: '#/components/responses/Forbidden'
 *          412:
 *             $ref: '#/components/responses/PreconditionFailed'
 */
router.post('/repliers-token', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = authRepliersTokenSchema.validate(ctx.request.body)
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const authService = ctx.state.container.resolve(AuthService)
  const result = await authService.useRepliersToken(value)
  ctx.body = {
    result
  }
})
router.post('/embed', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = authEmbedSchema.validate(ctx.request.body)
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const authService = ctx.state.container.resolve(AuthService)
  const result = await authService.embedLogin(value)
  ctx.body = {
    result
  }
})

// ─── Site User Registration ──────────────────────────────────────────────────
router.post('/register', async (ctx) => {
  const { email, password, name, phone } = ctx.request.body as {
    email?: string
    password?: string
    name?: string
    phone?: string
  }
  if (!email || !password) {
    ctx.throw(new ApiError('Email and password are required', 400))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')

  // Check if user already exists
  const existing = await db('site_users').where({ email: email.toLowerCase() }).first()
  if (existing) {
    ctx.throw(new ApiError('Email already registered', 409))
    return
  }

  // Hash password
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  const passwordHash = `${salt}:${derived.toString('hex')}`

  const [user] = await db('site_users')
    .insert({
      email: email.toLowerCase(),
      name: name || null,
      phone: phone || null,
      password_hash: passwordHash
    })
    .returning(['id', 'email', 'name', 'phone'])

  // Provision a Repliers client + agent assignment. Best-effort: failures
  // here MUST NOT block signup (RepliersClientsService logs and returns).
  try {
    const { default: RepliersClientsServiceCtor } = await import('../services/repliersClients.js')
    const rcs = ctx.state.container.resolve(RepliersClientsServiceCtor)
    await rcs.provisionForUser({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    })
  } catch (err) {
    const logger = ctx.state.container.resolve('logger') as any
    logger.error({ err, data: { userId: user.id } }, '[auth.register]: Repliers provisioning threw; continuing')
  }

  // Sign JWT for site user (role: 'site_user')
  const keys = ctx.state.container.resolve<{ private: Buffer }>('middleware.jwt.config.keys')
  const jwt = await import('jsonwebtoken')
  const token = jwt.default.sign(
    {
      email: user.email,
      sub: user.id.toString(),
      role: 'site_user',
      userId: user.id,
    },
    keys.private,
    {
      algorithm: 'RS256',
      expiresIn: '30d',
      issuer: process.env['JWT_ISSUER'] || 'http://repliers-proxy',
      jwtid: crypto.randomUUID(),
    }
  )

  ctx.body = {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    }
  }
})

// ─── Site User Login ─────────────────────────────────────────────────────────
router.post('/site-login', async (ctx) => {
  const { email, password } = ctx.request.body as { email?: string; password?: string }
  if (!email || !password) {
    ctx.throw(new ApiError('Email and password are required', 400))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ email: email.toLowerCase() }).first()

  if (!user || !user.password_hash) {
    ctx.throw(new ApiError('Invalid credentials', 401))
    return
  }

  const parts = (user.password_hash as string).split(':')
  const salt = parts[0] as string
  const storedHash = parts[1] as string
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  if (derived.toString('hex') !== storedHash) {
    ctx.throw(new ApiError('Invalid credentials', 401))
    return
  }

  const keys = ctx.state.container.resolve<{ private: Buffer }>('middleware.jwt.config.keys')
  const jwt = await import('jsonwebtoken')
  const token = jwt.default.sign(
    {
      email: user.email,
      sub: user.id.toString(),
      role: 'site_user',
      userId: user.id,
    },
    keys.private,
    {
      algorithm: 'RS256',
      expiresIn: '30d',
      issuer: process.env['JWT_ISSUER'] || 'http://repliers-proxy',
      jwtid: crypto.randomUUID(),
    }
  )

  ctx.body = {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    }
  }
})

// ─── Site User Profile ───────────────────────────────────────────────────────
router.get('/site-user/me', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ id: payload.userId }).first()
  if (!user) {
    ctx.throw(new ApiError('User not found', 404))
    return
  }

  ctx.body = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    favorites: user.favorites || [],
    search_history: user.search_history || [],
    created_at: user.created_at,
  }
})

// ─── Site User Profile Update ────────────────────────────────────────────────
router.patch('/site-user/me', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const { name, email, phone, password } = ctx.request.body as {
    name?: string
    email?: string
    phone?: string
    password?: string
  }

  const db = ctx.state['container'].resolve<Knex>('db')
  const updates: Record<string, any> = { updated_at: db.fn.now() }

  if (name !== undefined) updates['name'] = name
  if (email !== undefined) updates['email'] = email.toLowerCase()
  if (phone !== undefined) updates['phone'] = phone
  let passwordChanged = false
  if (password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const derived = (await scryptAsync(password, salt, 64)) as Buffer
    updates['password_hash'] = `${salt}:${derived.toString('hex')}`
    passwordChanged = true
  }

  await db('site_users').where({ id: payload.userId }).update(updates)
  const user = await db('site_users').where({ id: payload.userId }).first()

  if (passwordChanged) {
    const { default: MagicLinkSvc } = await import('../services/magicLink.js')
    const mls = ctx.state.container.resolve(MagicLinkSvc)
    await mls.invalidateAllForUser(payload.userId, 'password-change')
  }

  ctx.body = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
  }
})

// ─── Site User Delete Account ────────────────────────────────────────────────
router.delete('/site-user/me', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  await db('site_users').where({ id: payload.userId }).delete()

  ctx.body = { result: true }
})

// ─── Site User Saved Searches ────────────────────────────────────────────────
router.get('/site-saved-searches', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const searches = await db('saved_searches')
    .where({ user_id: payload.userId })
    .orderBy('created_at', 'desc')

  ctx.body = { searches }
})

router.post('/site-saved-searches', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const { name, filters, alertFrequency } = ctx.request.body as {
    name?: string
    filters?: object
    alertFrequency?: string
  }

  if (!name || !filters) {
    ctx.throw(new ApiError('Name and filters are required', 400))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const [search] = await db('saved_searches')
    .insert({
      user_id: payload.userId,
      name,
      filters: JSON.stringify(filters),
      alert_frequency: alertFrequency || 'daily',
    })
    .returning('*')

  ctx.body = { search }
})

router.patch('/site-saved-searches/:id', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const idParam = ctx.params['id']
  if (!idParam) {
    ctx.throw(new ApiError('Id is required', 400))
    return
  }
  const searchId = parseInt(idParam, 10)
  const { name, filters, alertFrequency } = ctx.request.body as {
    name?: string
    filters?: object
    alertFrequency?: string
  }

  const db = ctx.state['container'].resolve<Knex>('db')

  // Verify ownership
  const existing = await db('saved_searches').where({ id: searchId, user_id: payload.userId }).first()
  if (!existing) {
    ctx.throw(new ApiError('Search not found', 404))
    return
  }

  const updates: Record<string, any> = { updated_at: db.fn.now() }
  if (name !== undefined) updates['name'] = name
  if (filters !== undefined) updates['filters'] = JSON.stringify(filters)
  if (alertFrequency !== undefined) updates['alert_frequency'] = alertFrequency

  await db('saved_searches').where({ id: searchId }).update(updates)
  const search = await db('saved_searches').where({ id: searchId }).first()

  ctx.body = { search }
})

router.delete('/site-saved-searches/:id', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const idParam2 = ctx.params['id']
  if (!idParam2) {
    ctx.throw(new ApiError('Id is required', 400))
    return
  }
  const searchId = parseInt(idParam2, 10)
  const db = ctx.state['container'].resolve<Knex>('db')

  const existing = await db('saved_searches').where({ id: searchId, user_id: payload.userId }).first()
  if (!existing) {
    ctx.throw(new ApiError('Search not found', 404))
    return
  }

  await db('saved_searches').where({ id: searchId }).delete()
  ctx.body = { result: true }
})

// ─── Site User Favorites ─────────────────────────────────────────────────────
router.get('/site-favorites', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ id: payload.userId }).first()

  ctx.body = { favorites: user?.favorites || [] }
})

router.post('/site-favorites', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const { mlsNumber, address, price, boardId } = ctx.request.body as {
    mlsNumber?: string
    address?: string
    price?: number
    boardId?: number
  }

  if (!mlsNumber) {
    ctx.throw(new ApiError('mlsNumber is required', 400))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ id: payload.userId }).first()
  const favorites = user?.favorites || []

  // Prevent duplicates
  if (favorites.some((f: any) => f.mlsNumber === mlsNumber)) {
    ctx.body = { favorites }
    return
  }

  favorites.push({ mlsNumber, address, price, boardId, savedAt: new Date().toISOString() })
  await db('site_users')
    .where({ id: payload.userId })
    .update({ favorites: JSON.stringify(favorites), updated_at: db.fn.now() })

  ctx.body = { favorites }
})

router.delete('/site-favorites/:mlsNumber', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const { mlsNumber } = ctx.params
  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ id: payload.userId }).first()
  const favorites = (user?.favorites || []).filter((f: any) => f.mlsNumber !== mlsNumber)

  await db('site_users')
    .where({ id: payload.userId })
    .update({ favorites: JSON.stringify(favorites), updated_at: db.fn.now() })

  ctx.body = { favorites }
})

// ─── Site User Search History ────────────────────────────────────────────────
router.post('/site-search-history', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const { filters, label } = ctx.request.body as { filters?: object; label?: string }
  if (!filters) {
    ctx.throw(new ApiError('Filters are required', 400))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ id: payload.userId }).first()
  const history = user?.search_history || []

  // Keep last 50 entries
  history.unshift({ filters, label, timestamp: new Date().toISOString() })
  if (history.length > 50) history.length = 50

  await db('site_users')
    .where({ id: payload.userId })
    .update({ search_history: JSON.stringify(history), updated_at: db.fn.now() })

  ctx.body = { search_history: history }
})

router.get('/site-search-history', authMiddleware, async (ctx) => {
  const payload = ctx.state['user']
  if (payload.role !== 'site_user') {
    ctx.throw(new ApiError('Not a site user', 403))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('site_users').where({ id: payload.userId }).first()

  ctx.body = { search_history: user?.search_history || [] }
})

// ─── Admin Login ─────────────────────────────────────────────────────────────
router.post('/admin-login', async (ctx) => {
  const { email, password } = ctx.request.body as { email?: string; password?: string }
  if (!email || !password) {
    ctx.throw(new ApiError('Email and password are required', 400))
    return
  }

  const db = ctx.state.container.resolve<Knex>('db')
  const user = await db('admin_users').where({ email: email.toLowerCase() }).first()

  if (!user) {
    ctx.throw(new ApiError('Invalid credentials', 401))
    return
  }

  const parts = (user.password_hash as string).split(':')
  const salt = parts[0] as string
  const storedHash = parts[1] as string
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  if (derived.toString('hex') !== storedHash) {
    ctx.throw(new ApiError('Invalid credentials', 401))
    return
  }

  // Resolve the default organization for admin JWT
  const org = await db('organizations').where('slug', 'default').first()
  const orgId = org?.id || 1

  // Sign JWT directly for admin login (bypasses ACL lookup)
  const keys = ctx.state.container.resolve<{ private: Buffer }>('middleware.jwt.config.keys')
  const jwt = await import('jsonwebtoken')
  const token = jwt.default.sign(
    {
      email: user.email,
      sub: user.id.toString(),
      role: UserRole.Admin,
      orgId,
    },
    keys.private,
    {
      algorithm: 'RS256',
      expiresIn: '7d',
      issuer: process.env['JWT_ISSUER'] || 'http://repliers-proxy',
      jwtid: crypto.randomUUID(),
    }
  )

  ctx.body = {
    token,
    profile: {
      id: user.id,
      email: user.email,
      fname: user.first_name,
      lname: user.last_name,
      role: user.role
    }
  }
})

// ─── Magic-link redemption ───────────────────────────────────────────────────
// Single-use, 30-day expiry by default. Returns a site_user JWT that the
// frontend (or the Next.js proxy at /api/auth/magic-link) sets as a cookie.
import MagicLinkService from '../services/magicLink.js'
router.post('/magic-link/redeem', async (ctx) => {
  const { token } = ctx.request.body as { token?: string }
  if (!token) {
    ctx.throw(new ApiError('token is required', 400))
    return
  }
  const db = ctx.state.container.resolve<Knex>('db')
  const magicLinkService = ctx.state.container.resolve(MagicLinkService)
  const result = await magicLinkService.redeem(token)
  if (!result) {
    ctx.status = 410
    ctx.body = { error: 'invalid-or-expired-token' }
    return
  }
  const user = await db('site_users').where({ id: result.userId }).first()
  if (!user) {
    ctx.status = 404
    ctx.body = { error: 'user-not-found' }
    return
  }
  const keys = ctx.state.container.resolve<{ private: Buffer }>('middleware.jwt.config.keys')
  const jwt = await import('jsonwebtoken')
  const jwtToken = jwt.default.sign(
    {
      email: user.email,
      sub: user.id.toString(),
      role: 'site_user',
      userId: user.id,
    },
    keys.private,
    {
      algorithm: 'RS256',
      expiresIn: '30d',
      issuer: process.env['JWT_ISSUER'] || 'http://repliers-proxy',
      jwtid: crypto.randomUUID(),
    }
  )
  ctx.body = {
    token: jwtToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
    destinationPath: result.destinationPath,
    purpose: result.purpose,
  }
})

// ─── Admin: backfill Repliers clients for site_users missing repliers_client_id
router.post('/admin/repliers-backfill', authMiddleware, async (ctx) => {
  const role = ctx.state['user']?.role
  if (role !== 'admin' && role !== UserRole.Admin && role !== 'agent') {
    ctx.throw(new ApiError('Admin only', 403))
    return
  }
  const limit = Math.min(Number(ctx.query['limit']) || 50, 500)
  const { default: RepliersClientsServiceCtor } = await import('../services/repliersClients.js')
  const rcs = ctx.state.container.resolve(RepliersClientsServiceCtor)
  const result = await rcs.backfillMissing(limit)
  ctx.body = result
})

export default router
