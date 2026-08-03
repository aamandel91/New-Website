import crypto from 'node:crypto'
import Router from '@koa/router'
import type { PgBoss } from 'pg-boss'
import type { Logger } from 'pino'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import { REPLIERS_EVENTS, repliersQueue } from '../../jobs/queues.js'

/**
 * Per-event Repliers webhook receivers: POST /api/webhooks/repliers/<event>
 * (kebab-case, one route per event — see REPLIERS_EVENTS).
 *
 * Flow per route:
 *  1. Handshake — X-Hook-Secret header with an empty body: persist the
 *     secret to webhook_secrets (source='repliers', event=<event>), echo
 *     the header back, 200.
 *  2. Delivery auth — x-api-key must equal the stored secret
 *     (constant-time compare); 401 on mismatch.
 *  3. Enqueue `repliers.<event>` with the payload and return 200
 *     immediately. All processing happens in pg-boss workers, never here.
 *
 * The legacy single-route receiver (repliers.ts, POST /webhooks/repliers)
 * remains untouched for its existing subscription registry.
 */

const router = new Router({ prefix: '/repliers' })

for (const event of REPLIERS_EVENTS) {
  router.post(`/${event}`, async (ctx) => {
    const logger = ctx.state.container.resolve<Logger>('logger')
    const repo = ctx.state.container.resolve(SureSendIntegrationRepository)

    const hookSecret = headerStr(ctx.request.headers, 'x-hook-secret')
    const apiKey = headerStr(ctx.request.headers, 'x-api-key')
    const body = (ctx.request.body as Record<string, unknown> | undefined) || {}
    const isEmptyBody = Object.keys(body).length === 0

    // 1. Handshake
    if (hookSecret && isEmptyBody) {
      await repo.saveWebhookSecret('repliers', event, hookSecret)
      logger.info(
        { data: { event } },
        '[webhook:repliers-events] handshake secret stored'
      )
      ctx.set('X-Hook-Secret', hookSecret)
      ctx.status = 200
      ctx.body = ''
      return
    }

    // 2. Delivery auth
    const stored = await repo.getWebhookSecret('repliers', event)
    if (!stored || !apiKey || !timingSafeEqual(apiKey, stored.secret)) {
      logger.warn(
        { data: { event, hasStoredSecret: !!stored } },
        '[webhook:repliers-events] delivery auth failed'
      )
      ctx.status = 401
      ctx.body = { error: 'unauthorized' }
      return
    }

    // 3. Enqueue and return fast — no processing in the handler.
    const boss = ctx.state.container.resolve<PgBoss>('pgboss')
    await boss.send(repliersQueue(event), body)
    logger.info({ data: { event } }, '[webhook:repliers-events] event enqueued')
    ctx.status = 200
    ctx.body = { ok: true }
  })
}

function headerStr(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const v = headers[name]
  if (Array.isArray(v)) return v[0]
  return typeof v === 'string' && v !== '' ? v : undefined
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export default router
