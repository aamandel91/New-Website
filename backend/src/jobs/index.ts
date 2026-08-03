import { container } from 'tsyringe'
import type { PgBoss } from 'pg-boss'
import type { Logger } from 'pino'
import type { AppConfig } from '../config.js'
import {
  ALL_QUEUES,
  DEAD_LETTER_QUEUE,
  NOTIFY_SLACK_QUEUE,
  SURESEND_ACTIVITY_QUEUE,
  SURESEND_EVENTS,
  SURESEND_UNKNOWN_QUEUE,
  repliersQueue,
  suresendQueue
} from './queues.js'
import RepliersClientWorker from './workers/repliersClient.js'
import RepliersFavoriteWorker from './workers/repliersFavorite.js'
import RepliersSearchWorker from './workers/repliersSearch.js'
import RepliersSearchMatchWorker from './workers/repliersSearchMatch.js'
import RepliersListingWorker from './workers/repliersListing.js'
import RepliersMessageWorker from './workers/repliersMessage.js'
import RepliersAgentWorker from './workers/repliersAgent.js'
import SureSendPeopleWorker from './workers/suresendPeople.js'
import SureSendActivityWorker, {
  type ActivityJob
} from './workers/suresendActivity.js'
import NotifySlackWorker from './workers/notifySlack.js'
import type { WebhookPayload } from './lib/payload.js'

/** Queue policy required by the integration brief. */
const QUEUE_OPTIONS = {
  retryLimit: 3,
  retryBackoff: true,
  deadLetter: DEAD_LETTER_QUEUE
}

let started = false

/**
 * Boots pg-boss inside the existing server process: starts the queue
 * (pg-boss owns its `pgboss` schema, outside knex), creates all queues
 * with retry + dead-letter policy, and registers one worker per event
 * family. All webhook processing happens here — never in route handlers.
 *
 * Failure to start (e.g. Postgres unavailable, APP_DISABLE_PERSISTENCE)
 * logs an error but does not crash the server, matching how the rest of
 * the app degrades without persistence.
 */
export async function startJobQueue(): Promise<PgBoss | null> {
  const logger = container.resolve<Logger>('logger.global')
  const config = container.resolve<AppConfig>('config')
  if (started) return container.resolve<PgBoss>('pgboss')
  if (config.app.disable_persistence) {
    logger.warn('[jobs]: APP_DISABLE_PERSISTENCE is set; job queue disabled')
    return null
  }

  try {
    const boss = container.resolve<PgBoss>('pgboss')
    await boss.start()

    await boss.createQueue(DEAD_LETTER_QUEUE)
    for (const queue of ALL_QUEUES) {
      await boss.createQueue(queue, QUEUE_OPTIONS)
    }

    await registerWorkers(boss, logger)
    started = true
    logger.info(
      { data: { queues: ALL_QUEUES.length + 1 } },
      '[jobs]: pg-boss started and workers registered'
    )
    return boss
  } catch (err) {
    logger.error({ err }, '[jobs]: failed to start pg-boss job queue')
    return null
  }
}

type Handler<T> = (data: T) => Promise<void>

async function work<T extends object>(
  boss: PgBoss,
  queue: string,
  handler: Handler<T>
): Promise<void> {
  await boss.work<T>(queue, async (jobs) => {
    for (const job of jobs) {
      await handler(job.data)
    }
  })
}

async function registerWorkers(boss: PgBoss, logger: Logger): Promise<void> {
  const clients = container.resolve(RepliersClientWorker)
  const favorites = container.resolve(RepliersFavoriteWorker)
  const searches = container.resolve(RepliersSearchWorker)
  const matches = container.resolve(RepliersSearchMatchWorker)
  const listings = container.resolve(RepliersListingWorker)
  const messages = container.resolve(RepliersMessageWorker)
  const agents = container.resolve(RepliersAgentWorker)
  const people = container.resolve(SureSendPeopleWorker)
  const activity = container.resolve(SureSendActivityWorker)
  const slack = container.resolve(NotifySlackWorker)

  await work<WebhookPayload>(boss, repliersQueue('client-created'), (d) =>
    clients.created(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('client-updated'), (d) =>
    clients.updated(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('client-deleted'), (d) =>
    clients.deleted(d)
  )

  await work<WebhookPayload>(boss, repliersQueue('favorite-created'), (d) =>
    favorites.created(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('favorite-deleted'), (d) =>
    favorites.deleted(d)
  )

  await work<WebhookPayload>(boss, repliersQueue('search-created'), (d) =>
    searches.created(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('search-updated'), (d) =>
    searches.updated(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('search-deleted'), (d) =>
    searches.deleted(d)
  )

  await work<WebhookPayload>(boss, repliersQueue('search-match-created'), (d) =>
    matches.created(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('search-match-updated'), (d) =>
    matches.updated(d)
  )

  await work<WebhookPayload>(boss, repliersQueue('listing-created'), (d) =>
    listings.created(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('listing-updated'), (d) =>
    listings.updated(d)
  )
  await work<WebhookPayload>(boss, repliersQueue('listing-deleted'), (d) =>
    listings.deleted(d)
  )

  await work<WebhookPayload>(boss, repliersQueue('message-created'), (d) =>
    messages.created(d)
  )

  for (const event of [
    'agent-created',
    'agent-updated',
    'agent-deleted'
  ] as const) {
    await work<WebhookPayload>(boss, repliersQueue(event), (d) =>
      agents.handle(event, d)
    )
  }

  for (const event of SURESEND_EVENTS) {
    await work<WebhookPayload>(boss, suresendQueue(event), (d) =>
      people.handle(event, d)
    )
  }
  await work<WebhookPayload>(boss, SURESEND_UNKNOWN_QUEUE, async (d) => {
    logger.info(
      { data: { event: d['event'] } },
      '[jobs]: unhandled SureSend event acknowledged'
    )
  })

  await work<ActivityJob>(boss, SURESEND_ACTIVITY_QUEUE, (d) =>
    activity.handle(d)
  )

  await work<{ text?: string }>(boss, NOTIFY_SLACK_QUEUE, (d) =>
    slack.notify(d)
  )

  // Dead-letter arrivals are terminal failures — log loudly for the audit
  // trail; the job body is kept in the pgboss schema for inspection.
  await boss.work(DEAD_LETTER_QUEUE, async (jobs) => {
    for (const job of jobs) {
      logger.warn(
        { data: { job: job.data } },
        '[jobs]: job arrived on dead-letter queue after exhausting retries'
      )
    }
  })
}

/** Queue depths for the /health/integrations route. */
export async function queueDepths(): Promise<
  { name: string; queued: number; active: number; deferred: number }[]
> {
  const boss = container.resolve<PgBoss>('pgboss')
  const queues = await boss.getQueues([...ALL_QUEUES, DEAD_LETTER_QUEUE])
  return queues.map((q) => ({
    name: q.name,
    queued: q.queuedCount ?? 0,
    active: q.activeCount ?? 0,
    deferred: q.deferredCount ?? 0
  }))
}

export function jobQueueStarted(): boolean {
  return started
}
