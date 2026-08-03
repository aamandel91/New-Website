/**
 * Audits webhook subscriptions on both sides:
 *  - Repliers: lists subscriptions from the Repliers API and checks one
 *    exists per expected event with a stored handshake secret locally.
 *  - SureSend: lists webhooks and checks one targets this backend with a
 *    healthy status.
 *
 * Exits nonzero if any expected subscription is missing or failed —
 * suitable for a cron/audit hook.
 *
 * Run with:
 *   cd backend
 *   npx tsx scripts/webhook-health.ts
 */
import 'reflect-metadata'
import '../src/providers/index.js'
import { container } from 'tsyringe'
import type { Knex } from 'knex'
import type { AppConfig } from '../src/config.js'
import SureSendService from '../src/services/suresend/client.js'
import { REPLIERS_EVENTS } from '../src/jobs/queues.js'

async function main() {
  const config = container.resolve<AppConfig>('config')
  const db = container.resolve<Knex>('db')
  let failures = 0

  // ── Repliers side ─────────────────────────────────────────────
  try {
    const response = await fetch(`${config.repliers.base_url}/webhooks`, {
      headers: { 'REPLIERS-API-KEY': config.repliers.api_key }
    })
    if (!response.ok) {
      console.error(`✗ Repliers GET /webhooks returned ${response.status}`)
      failures += 1
    } else {
      const body = (await response.json()) as
        | { webhooks?: unknown[] }
        | unknown[]
      const subs = Array.isArray(body) ? body : (body.webhooks ?? [])
      console.log(`Repliers subscriptions found: ${subs.length}`)
      const subsJson = JSON.stringify(subs)
      for (const event of REPLIERS_EVENTS) {
        if (!subsJson.includes(`/api/webhooks/repliers/${event}`)) {
          console.error(`✗ Repliers subscription missing for ${event}`)
          failures += 1
        }
      }
    }
  } catch (err) {
    console.error(
      '✗ Could not list Repliers webhooks:',
      err instanceof Error ? err.message : err
    )
    failures += 1
  }

  // Local handshake secrets — each subscribed event should have one.
  const secrets = await db('webhook_secrets')
    .where({ source: 'repliers' })
    .select('event')
  const secretEvents = new Set(secrets.map((s) => s.event))
  console.log(`Local handshake secrets stored: ${secretEvents.size}`)
  for (const event of REPLIERS_EVENTS) {
    if (!secretEvents.has(event)) {
      console.error(`✗ No handshake secret stored for repliers/${event}`)
      failures += 1
    }
  }

  // ── SureSend side ─────────────────────────────────────────────
  const suresend = container.resolve(SureSendService)
  if (!suresend.enabled) {
    console.error('✗ SURESEND_API_TOKEN not set')
    failures += 1
  } else {
    try {
      const webhooks = await suresend.listWebhooks()
      const hooks = webhooks.data ?? []
      console.log(`SureSend webhooks found: ${hooks.length}`)
      const ours = hooks.filter((h) =>
        h.url?.includes('/api/webhooks/suresend')
      )
      if (ours.length === 0) {
        console.error('✗ No SureSend webhook targets /api/webhooks/suresend')
        failures += 1
      }
      for (const hook of ours) {
        if (
          hook.status &&
          !['active', 'ok', 'healthy'].includes(hook.status.toLowerCase())
        ) {
          console.error(`✗ SureSend webhook ${hook.id} status: ${hook.status}`)
          failures += 1
        }
      }
    } catch (err) {
      console.error(
        '✗ Could not list SureSend webhooks:',
        err instanceof Error ? err.message : err
      )
      failures += 1
    }
  }

  if (failures > 0) {
    console.error(`Webhook health: ${failures} problem(s) found`)
    process.exit(1)
  }
  console.log('Webhook health: all expected subscriptions present ✓')
  process.exit(0)
}

main().catch((err) => {
  console.error('webhook-health failed:', err)
  process.exit(1)
})
