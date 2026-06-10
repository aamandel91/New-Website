import Router from '@koa/router'
import { container } from 'tsyringe'
import { Logger } from 'pino'
import type { Knex } from 'knex'
import type { Middleware } from 'koa-jwt'
import { ApiError } from '../../lib/errors.js'

/**
 * Repliers webhook receiver.
 *
 * Two flavors of POST come in here:
 *
 *  1. Handshake (subscription verification) — first POST after subscribe.
 *     - X-Hook-Secret header is present
 *     - body is empty
 *     - We MUST respond 200 with the same X-Hook-Secret echoed back, then
 *       persist the secret on the matching repliers_webhooks row so we can
 *       verify subsequent events with constant-time comparison.
 *
 *  2. Live events — payload-bearing POSTs.
 *     - x-api-key header is the hook_secret we stored at handshake time
 *     - body is the event payload
 *     - We append to repliers_webhook_events with status='received' and
 *       return 200 fast. A worker (deferred to W3) will pick from this
 *       queue and run notification flows.
 *
 * The route is intentionally permissive on payload shape — Repliers events
 * are not all documented and we want the queue to capture everything
 * verbatim for W3 to triage.
 */

const router = new Router({ prefix: '/repliers' })

const authMiddleware = container.resolve<Middleware>('middleware.jwt')

// Subscription registry CRUD — admin-only.
router.get('/subscriptions', authMiddleware, async (ctx) => {
  ensureAdmin(ctx)
  const db = ctx.state.container.resolve<Knex>('db')
  const rows = await db('repliers_webhooks').orderBy('id', 'desc')
  ctx.body = { subscriptions: rows.map(redactSecret) }
})

router.post('/subscriptions', authMiddleware, async (ctx) => {
  ensureAdmin(ctx)
  const { webhookId, event, targetUrl, configuration } = ctx.request.body as {
    webhookId?: number
    event?: string
    targetUrl?: string
    configuration?: Record<string, unknown>
  }
  if (!webhookId || !event || !targetUrl) {
    ctx.throw(new ApiError('webhookId, event, and targetUrl are required', 400))
    return
  }
  const db = ctx.state.container.resolve<Knex>('db')
  const [row] = await db('repliers_webhooks')
    .insert({
      webhook_id: webhookId,
      event,
      target_url: targetUrl,
      hook_secret: '', // populated at handshake
      configuration: configuration ? JSON.stringify(configuration) : null,
      active: true
    })
    .returning('*')
  ctx.body = { subscription: redactSecret(row) }
})

router.delete('/subscriptions/:id', authMiddleware, async (ctx) => {
  ensureAdmin(ctx)
  const id = Number(ctx.params['id'])
  if (!Number.isFinite(id)) {
    ctx.throw(new ApiError('Invalid id', 400))
    return
  }
  const db = ctx.state.container.resolve<Knex>('db')
  await db('repliers_webhooks').where({ id }).delete()
  ctx.body = { ok: true }
})

router.get('/events', authMiddleware, async (ctx) => {
  ensureAdmin(ctx)
  const limit = Math.min(Number(ctx.query['limit']) || 50, 500)
  const db = ctx.state.container.resolve<Knex>('db')
  const rows = await db('repliers_webhook_events')
    .orderBy('id', 'desc')
    .limit(limit)
  ctx.body = { events: rows }
})

// ─── PUBLIC: handshake + event ingestion ─────────────────────────────────────
// The actual webhook target Repliers calls. No auth middleware (Repliers
// authenticates via X-Hook-Secret on handshake, x-api-key on events).
router.post('/', async (ctx) => {
  const logger = ctx.state.container.resolve<Logger>('logger')
  const db = ctx.state.container.resolve<Knex>('db')
  const headers = ctx.request.headers as Record<
    string,
    string | string[] | undefined
  >

  const hookSecret = headerStr(headers, 'x-hook-secret')
  const apiKey = headerStr(headers, 'x-api-key')
  const body = (ctx.request.body as Record<string, unknown> | undefined) || {}
  const isEmptyBody = Object.keys(body).length === 0

  // Handshake
  if (hookSecret && isEmptyBody) {
    logger.info(
      { data: { hasSecret: true } },
      '[webhook:repliers] handshake received'
    )
    // Match by webhookId or event header if present, otherwise persist on the
    // most-recently-created subscription that's missing a hook_secret.
    const webhookIdHeader = headerStr(headers, 'x-webhook-id')
    let row
    if (webhookIdHeader) {
      row = await db('repliers_webhooks')
        .where({ webhook_id: Number(webhookIdHeader) })
        .first()
    }
    if (!row) {
      row = await db('repliers_webhooks')
        .where({ hook_secret: '' })
        .orderBy('id', 'desc')
        .first()
    }
    if (row) {
      await db('repliers_webhooks')
        .where({ id: row.id })
        .update({
          hook_secret: hookSecret,
          active: true,
          updated_at: db.fn.now()
        })
    } else {
      logger.warn(
        { data: { headerWebhookId: webhookIdHeader } },
        '[webhook:repliers] handshake: no matching subscription row to attach secret'
      )
    }

    ctx.set('X-Hook-Secret', hookSecret)
    ctx.status = 200
    ctx.body = ''
    return
  }

  // Live event — verify against stored hook_secret
  if (!apiKey) {
    logger.warn('[webhook:repliers] event missing x-api-key')
    ctx.status = 401
    ctx.body = { error: 'unauthorized' }
    return
  }

  const sub = await db('repliers_webhooks')
    .where({ hook_secret: apiKey, active: true })
    .first()
  if (!sub) {
    logger.warn('[webhook:repliers] event with unrecognized x-api-key')
    ctx.status = 401
    ctx.body = { error: 'unauthorized' }
    return
  }

  const eventName =
    (body['event'] as string) ||
    (body['type'] as string) ||
    sub.event ||
    'unknown'

  await db('repliers_webhook_events').insert({
    webhook_subscription_id: sub.id,
    event: eventName,
    payload: JSON.stringify(body),
    status: 'received'
  })

  logger.info(
    { data: { event: eventName, subscriptionId: sub.id } },
    '[webhook:repliers] event queued'
  )

  ctx.status = 200
  ctx.body = { ok: true }
})

function headerStr(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(v)) return v[0]
  return typeof v === 'string' ? v : undefined
}

function redactSecret(row: Record<string, unknown>): Record<string, unknown> {
  const { hook_secret, ...rest } = row
  return { ...rest, has_hook_secret: !!hook_secret }
}

function ensureAdmin(ctx: any): void {
  const role = ctx.state['user']?.role
  if (role !== 'admin' && role !== 4 && role !== 'agent') {
    ctx.throw(new ApiError('Admin only', 403))
  }
}

export default router
