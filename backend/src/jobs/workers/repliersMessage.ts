import { inject, injectable } from 'tsyringe'
import type { PgBoss } from 'pg-boss'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import PersonMapService from '../lib/personMap.js'
import { payloadHash } from '../lib/portal.js'
import { clientId, messageBody, type WebhookPayload } from '../lib/payload.js'
import { NOTIFY_SLACK_QUEUE } from '../queues.js'

/**
 * repliers.message-created — a portal message from a client. Mirrors the
 * body onto the SureSend contact as a note and pings Slack (skipped
 * gracefully when SLACK_WEBHOOK_URL is unset).
 */
@injectable()
export default class RepliersMessageWorker {
  constructor(
    @inject('pgboss') private boss: PgBoss,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository,
    private personMap: PersonMapService
  ) {}

  async created(payload: WebhookPayload): Promise<void> {
    const client = clientId(payload)
    const body = messageBody(payload)
    const key = `message-created:${client ?? 'unknown'}:${payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = client ? await this.personMap.findByClientId(client) : null
    if (personId && body) {
      await this.suresend.createNote({
        personId,
        subject: 'Portal message',
        body
      })
    }

    await this.boss.send(NOTIFY_SLACK_QUEUE, {
      text: `📨 New portal message${client ? ` from client #${client}` : ''}: ${body ?? '(no body)'}`
    })
  }
}
