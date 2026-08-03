import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import { payloadHash } from '../lib/portal.js'
import { type WebhookPayload } from '../lib/payload.js'

/**
 * repliers.agent-created / agent-updated / agent-deleted
 *
 * Roster data must never be cached or hardcoded (it always comes from live
 * SureSend GET /groups and GET /users calls), so agent events are only
 * deduped and logged for observability.
 */
@injectable()
export default class RepliersAgentWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private repo: SureSendIntegrationRepository
  ) {}

  async handle(event: string, payload: WebhookPayload): Promise<void> {
    const agentId =
      (payload['agentId'] as number | string | undefined) ??
      ((payload['agent'] as Record<string, unknown> | undefined)?.[
        'agentId'
      ] as number | string | undefined)
    const key = `${event}:${agentId ?? payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return
    this.logger.info(
      { data: { event, agentId } },
      '[repliers.agent]: agent event received (roster stays live-fetched, no local action)'
    )
  }
}
