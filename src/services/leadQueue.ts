import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'

/**
 * Durable retry queue for leads that failed to sync to SureSend.
 *
 * Why: every lead-capture surface on the site fires into the SureSend client.
 * If the API token is missing, SureSend is down, or the network hiccups, the
 * lead used to either 502 (contact forms) or vanish into a console.error
 * (open house). One outage during a busy Sunday open house = lost signups.
 *
 * Now: failures are persisted here and can be retried from the admin panel
 * (/admin/lead-queue) or programmatically. The visitor always gets a success
 * response - the lead is safe either way.
 *
 * Storage: data/failed-leads.json, matching the existing open-house storage
 * pattern. NOTE: like the other JSON-file stores, this is lost on redeploy
 * with serverless hosting - migrate to the backend Postgres alongside the
 * open-house tables when that work happens.
 */

export type QueuedLeadSource =
  | 'lead_form'
  | 'open_house_session'
  | 'open_house_form'

export interface QueuedLeadPayload {
  name: string
  email: string
  phone?: string
  message?: string
  formType: string
  propertyAddress?: string
  mlsNumber?: string
  source?: string
}

export interface QueuedLead {
  id: string
  payload: QueuedLeadPayload
  queueSource: QueuedLeadSource
  reason: string
  attempts: number
  createdAt: string
  lastAttemptAt: string | null
}

const DATA_DIR = path.join(process.cwd(), 'data')
const QUEUE_FILE = path.join(DATA_DIR, 'failed-leads.json')

// Serialize writes within this process so two simultaneous failures don't
// interleave and corrupt the file.
let writeChain: Promise<unknown> = Promise.resolve()
const withLock = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = writeChain.then(fn, fn)
  writeChain = next.catch(() => undefined)
  return next
}

async function readQueue(): Promise<QueuedLead[]> {
  try {
    const raw = await fs.readFile(QUEUE_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueuedLead[]) : []
  } catch {
    return []
  }
}

async function writeQueue(items: QueuedLead[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  // Write to a temp file then rename for an atomic-ish swap.
  const tmp = `${QUEUE_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf-8')
  await fs.rename(tmp, QUEUE_FILE)
}

const errorToReason = (err: unknown): string => {
  if (err instanceof Error) return err.message.slice(0, 500)
  return String(err).slice(0, 500)
}

/** Persist a failed lead. Never throws - queueing must not break the form. */
export async function enqueueFailedLead(
  payload: QueuedLeadPayload,
  queueSource: QueuedLeadSource,
  error: unknown
): Promise<void> {
  try {
    await withLock(async () => {
      const items = await readQueue()
      items.push({
        id: crypto.randomUUID(),
        payload,
        queueSource,
        reason: errorToReason(error),
        attempts: 1,
        createdAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString()
      })
      await writeQueue(items)
    })
    console.warn(
      `[LeadQueue] Lead for ${payload.email} queued for retry (${queueSource})`
    )
  } catch (err) {
    // Last-resort logging: queueing itself failed.
    console.error('[LeadQueue] CRITICAL: failed to persist lead', payload, err)
  }
}

export async function listQueuedLeads(): Promise<QueuedLead[]> {
  return readQueue()
}

export async function removeQueuedLead(id: string): Promise<boolean> {
  return withLock(async () => {
    const items = await readQueue()
    const next = items.filter((l) => l.id !== id)
    if (next.length === items.length) return false
    await writeQueue(next)
    return true
  })
}

/** Record a retry attempt. On success the lead leaves the queue. */
export async function recordRetryResult(
  id: string,
  success: boolean,
  error?: unknown
): Promise<void> {
  await withLock(async () => {
    const items = await readQueue()
    if (success) {
      await writeQueue(items.filter((l) => l.id !== id))
      return
    }
    const item = items.find((l) => l.id === id)
    if (item) {
      item.attempts += 1
      item.lastAttemptAt = new Date().toISOString()
      if (error) item.reason = errorToReason(error)
      await writeQueue(items)
    }
  })
}
