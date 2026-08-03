import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import type { AppConfig } from '../../config.js'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import { TENANT } from './portal.js'

/**
 * All lead-facing outbound communication goes through here and is gated by
 * SEND_LEAD_ALERTS (config.integrations.send_lead_alerts, default false).
 * When the flag is off, the would-be send is written to pending_alerts and
 * logged instead. Agent-facing tasks and notes never go through this
 * service — they are always live.
 */
@injectable()
export default class LeadAlertService {
  constructor(
    @inject('logger') private logger: Logger,
    @inject('config') private config: AppConfig,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository
  ) {}

  get enabled(): boolean {
    return this.config.integrations.send_lead_alerts
  }

  async text(params: {
    personId: string
    message: string
    reason: string
  }): Promise<void> {
    if (this.enabled) {
      await this.suresend.sendText({
        personId: params.personId,
        message: params.message
      })
      return
    }
    await this.repo.insertPendingAlert({
      tenant: TENANT,
      personId: params.personId,
      channel: 'text',
      payload: { message: params.message },
      reason: params.reason
    })
    this.logger.info(
      { data: { personId: params.personId, reason: params.reason } },
      '[LeadAlertService]: SEND_LEAD_ALERTS off — text queued to pending_alerts'
    )
  }

  async email(params: {
    personId: string
    subject: string
    body: string
    reason: string
  }): Promise<void> {
    if (this.enabled) {
      await this.suresend.sendEmail({
        personId: params.personId,
        subject: params.subject,
        body: params.body
      })
      return
    }
    await this.repo.insertPendingAlert({
      tenant: TENANT,
      personId: params.personId,
      channel: 'email',
      payload: { subject: params.subject, body: params.body },
      reason: params.reason
    })
    this.logger.info(
      { data: { personId: params.personId, reason: params.reason } },
      '[LeadAlertService]: SEND_LEAD_ALERTS off — email queued to pending_alerts'
    )
  }
}
