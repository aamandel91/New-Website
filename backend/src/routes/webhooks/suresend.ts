import crypto from 'node:crypto'
import Router from '@koa/router'
import type { PgBoss } from 'pg-boss'
import type { Logger } from 'pino'
import type { AppConfig } from '../../config.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import {
  SURESEND_EVENTS,
  SURESEND_UNKNOWN_QUEUE,
  suresendQueue
} from '../../jobs/queues.js'
import { payloadHash } from '../../jobs/lib/portal.js'

/**
 * SureSend inbound webhook: POST /api/webhooks/suresend
 *
 * - X-Webhook-Signature is verified as HMAC-SHA256 of the raw request
 *   body using SURESEND_WEBHOOK_SECRET (timing-safe compare). The raw
 *   body is available because koa-body runs with includeUnparsed: true.
 * - Deliveries are deduped on payload eventId via processed_webhook_events.
 * - The event is enqueued to `suresend.<event>` and 200 is returned fast —
 *   SureSend requires a response within 5 seconds and disables the
 *   webhook after 10 consecutive failures, so no processing happens here.
 */

const router = new Router({ prefix: '/suresend' })

router.post('/', async (ctx) => {
  const logger = ctx.state.container.resolve<Logger>('logger')
  const config = ctx.state.container.resolve<AppConfig>('config')

  const secret = config.suresend.webhook_secret
  if (!secret) {
    // Fail closed: without a configured secret nothing can be verified.
    logger.error(
      '[webhook:suresend] SURESEND_WEBHOOK_SECRET unset; rejecting delivery'
    )
    ctx.status = 401
    ctx.body = { error: 'unauthorized' }
    return
  }

  // koa-body with includeUnparsed exposes the raw body under this symbol
  // (same access pattern as middleware.boss.webhook.auth).
  // @ts-ignore koa-body patchNode attaches body to the node request
  const rawBody: string | undefined = ctx.req.body?.[
    Symbol.for('unparsedBody')
  ] as string | undefined
  const signature = ctx.get('x-webhook-signature')
  if (!rawBody || !signature || !verifySignature(rawBody, signature, secret)) {
    logger.warn('[webhook:suresend] invalid signature')
    ctx.status = 401
    ctx.body = { error: 'invalid signature' }
    return
  }

  const body = (ctx.request.body as Record<string, unknown> | undefined) || {}
  const eventId =
    typeof body['eventId'] === 'string' || typeof body['eventId'] === 'number'
      ? String(body['eventId'])
      : payloadHash(body)
  const event = typeof body['event'] === 'string' ? body['event'] : 'unknown'

  const repo = ctx.state.container.resolve(SureSendIntegrationRepository)
  const fresh = await repo.markProcessed('suresend', `suresend:${eventId}`)
  if (!fresh) {
    logger.info(
      { data: { eventId, event } },
      '[webhook:suresend] duplicate delivery ignored'
    )
    ctx.status = 200
    ctx.body = { ok: true, duplicate: true }
    return
  }

  const boss = ctx.state.container.resolve<PgBoss>('pgboss')
  const queue = (SURESEND_EVENTS as readonly string[]).includes(event)
    ? suresendQueue(event)
    : SURESEND_UNKNOWN_QUEUE
  await boss.send(queue, body)
  logger.info(
    { data: { eventId, event, queue } },
    '[webhook:suresend] event enqueued'
  )
  ctx.status = 200
  ctx.body = { ok: true }
})

export function verifySignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')
  const bufA = Buffer.from(signature)
  const bufB = Buffer.from(expected)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export default router
