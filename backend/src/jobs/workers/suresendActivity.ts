import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import SureSendService from '../../services/suresend/client.js'
import type { SureSendEventInput } from '../../services/suresend/types.js'
import PersonMapService from '../lib/personMap.js'

export interface ActivityJob {
  /** Portal user email — resolved to a SureSend person before sending. */
  email: string
  firstName?: string | undefined
  lastName?: string | undefined
  event: SureSendEventInput
}

/**
 * suresend.activity — server-side portal activity (listing detail views,
 * search executions, lead form submissions). Enqueued fire-and-forget by
 * route middleware; failures here never affect page renders.
 */
@injectable()
export default class SureSendActivityWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private personMap: PersonMapService
  ) {}

  async handle(job: ActivityJob): Promise<void> {
    if (!job.email) {
      this.logger.warn('[suresend.activity]: job without email; skipping')
      return
    }
    const personId = await this.personMap.ensurePerson({
      email: job.email,
      firstName: job.firstName,
      lastName: job.lastName
    })
    await this.suresend.createEvent({ ...job.event, personId })
  }
}
