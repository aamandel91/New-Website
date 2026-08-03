import { inject, injectable } from 'tsyringe'
import type { PgBoss } from 'pg-boss'
import type { Logger } from 'pino'
import type { AppConfig } from '../config.js'
import type { SureSendEventInput } from './suresend/types.js'
import { SURESEND_ACTIVITY_QUEUE } from '../jobs/queues.js'
import { jobQueueStarted } from '../jobs/index.js'

interface PortalUser {
  email?: string | undefined
  fname?: string | undefined
  lname?: string | undefined
  firstName?: string | undefined
  lastName?: string | undefined
}

/**
 * Fire-and-forget enqueue of server-side portal activity (listing views,
 * searches, form submissions) onto the suresend.activity queue. Never
 * throws and never blocks the response — a page render must not fail
 * because CRM tracking is down.
 */
@injectable()
export default class SureSendActivityService {
  constructor(
    @inject('logger') private logger: Logger,
    @inject('config') private config: AppConfig,
    @inject('pgboss') private boss: PgBoss
  ) {}

  track(user: PortalUser | undefined, event: SureSendEventInput): void {
    try {
      if (!this.config.suresend.enabled || !jobQueueStarted()) return
      const email = user?.email
      if (!email) return // only identified portal users are tracked
      this.boss
        .send(SURESEND_ACTIVITY_QUEUE, {
          email,
          firstName: user?.fname ?? user?.firstName,
          lastName: user?.lname ?? user?.lastName,
          event
        })
        .catch((err: unknown) => {
          this.logger.warn(
            { err },
            '[SureSendActivityService]: failed to enqueue activity event'
          )
        })
    } catch (err) {
      this.logger.warn(
        { err },
        '[SureSendActivityService]: activity tracking error (ignored)'
      )
    }
  }
}
