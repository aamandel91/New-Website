import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { UserRole } from '../constants.js'
import type { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import SureSendService from '../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../repository/suresendIntegration.js'
import { jobQueueStarted, queueDepths } from '../jobs/index.js'

/**
 * GET /api/health/integrations — admin-only integration health snapshot:
 * SureSend identity check, pg-boss queue depths, processed webhook events
 * in the last 24h, unsent pending_alerts count, and which webhook_secrets
 * rows exist (Repliers handshake state).
 */

const router = new Router({ prefix: '/health' })

const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware =
  container.resolve<RoleMiddlewareCreator>('middleware.role')

router.get(
  '/integrations',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const suresend = ctx.state.container.resolve(SureSendService)
    const repo = ctx.state.container.resolve(SureSendIntegrationRepository)

    const identity = suresend.enabled ? await suresend.verifyConnection() : null

    let queues: Awaited<ReturnType<typeof queueDepths>> | null = null
    if (jobQueueStarted()) {
      try {
        queues = await queueDepths()
      } catch {
        queues = null
      }
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [processedLast24h, pendingAlerts, webhookSecrets] = await Promise.all(
      [
        repo.processedCountSince(since),
        repo.pendingAlertsCount(),
        repo.listWebhookSecrets()
      ]
    )

    ctx.body = {
      suresend: {
        enabled: suresend.enabled,
        connected: !!identity,
        teamName: identity?.teamName ?? identity?.name ?? null
      },
      jobQueue: {
        started: jobQueueStarted(),
        queues
      },
      processedWebhookEventsLast24h: processedLast24h,
      pendingAlertsUnsent: pendingAlerts,
      webhookSecrets
    }
  }
)

export default router
