/**
 * pg-boss queue names for the Repliers → SureSend integration.
 *
 * One queue per Repliers webhook event (`repliers.<event>`), one per
 * SureSend inbound event family (`suresend.<event>`), plus internal
 * queues for portal activity fan-in and Slack notifications. Failed jobs
 * (3 attempts, exponential backoff) land on DEAD_LETTER_QUEUE.
 */

export const REPLIERS_EVENTS = [
  'listing-created',
  'listing-updated',
  'listing-deleted',
  'favorite-created',
  'favorite-deleted',
  'search-created',
  'search-updated',
  'search-deleted',
  'search-match-created',
  'search-match-updated',
  'client-created',
  'client-updated',
  'client-deleted',
  'message-created',
  'agent-created',
  'agent-updated',
  'agent-deleted'
] as const

export type RepliersEvent = (typeof REPLIERS_EVENTS)[number]

export const SURESEND_EVENTS = [
  'peopleUpdated',
  'peopleStageUpdated',
  'peopleTagsAdded'
] as const

export type SureSendEventName = (typeof SURESEND_EVENTS)[number]

export const repliersQueue = (event: RepliersEvent): string =>
  `repliers.${event}`

export const suresendQueue = (event: string): string => `suresend.${event}`

/** Catch-all for SureSend events we have no dedicated handler for. */
export const SURESEND_UNKNOWN_QUEUE = 'suresend.unknown'

/** Fire-and-forget portal activity events (Task 7). */
export const SURESEND_ACTIVITY_QUEUE = 'suresend.activity'

export const NOTIFY_SLACK_QUEUE = 'notify.slack'

export const DEAD_LETTER_QUEUE = 'dead-letter'

export const ALL_QUEUES: string[] = [
  ...REPLIERS_EVENTS.map(repliersQueue),
  ...SURESEND_EVENTS.map(suresendQueue),
  SURESEND_UNKNOWN_QUEUE,
  SURESEND_ACTIVITY_QUEUE,
  NOTIFY_SLACK_QUEUE
]
