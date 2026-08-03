import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import { TENANT } from '../lib/portal.js'

export interface SureSendInboundEvent {
  eventId?: string
  event?: string
  data?: {
    id?: string
    email?: string
    stage?: string
    tags?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * suresend.peopleUpdated / peopleStageUpdated / peopleTagsAdded
 *
 * Kept intentionally minimal: refresh the local person mapping so the
 * portal reflects CRM-side changes, and log the change. (Dedupe on
 * eventId happens in the webhook receiver before enqueue.)
 */
@injectable()
export default class SureSendPeopleWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private repo: SureSendIntegrationRepository
  ) {}

  async handle(event: string, payload: SureSendInboundEvent): Promise<void> {
    const person = payload.data
    const personId = person?.id
    const email = person?.email?.toLowerCase()

    if (personId && email) {
      await this.repo.upsertPersonMap({
        tenant: TENANT,
        email,
        suresendPersonId: personId
      })
    }

    this.logger.info(
      {
        data: {
          event,
          personId,
          email,
          stage: person?.stage,
          tags: person?.tags
        }
      },
      '[suresend.people]: CRM-side change persisted'
    )
  }
}
