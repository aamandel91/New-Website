/**
 * Subscribes this backend to every Repliers webhook event, one
 * subscription per event, targeting the per-event receiver routes
 * (/api/webhooks/repliers/<event>).
 *
 * MANUAL STEP — do NOT wire into deploys. Run once after the Repliers
 * plan upgrade that enables webhooks:
 *   cd backend
 *   WEBHOOK_BASE_URL=https://<railway-backend-url> npx tsx scripts/subscribe-repliers-webhooks.ts
 *
 * Reads REPLIERS_API_KEY (the server key, NOT the CSR key) and
 * WEBHOOK_BASE_URL from the environment / backend .env. Prints a table of
 * results. Repliers will immediately POST a handshake (X-Hook-Secret) to
 * each target URL; the receiver persists the secret to webhook_secrets.
 */
import 'reflect-metadata'
import '../src/providers/index.js'
import { container } from 'tsyringe'
import type { AppConfig } from '../src/config.js'
import { REPLIERS_EVENTS } from '../src/jobs/queues.js'

async function main() {
  const config = container.resolve<AppConfig>('config')
  const apiKey = config.repliers.api_key
  const baseUrl = config.integrations.webhook_base_url
  if (!apiKey) {
    console.error('REPLIERS_API_KEY is not set — aborting.')
    process.exit(1)
  }
  if (!baseUrl) {
    console.error(
      'WEBHOOK_BASE_URL is not set (public Railway URL of this backend) — aborting.'
    )
    process.exit(1)
  }

  const results: { event: string; targetUrl: string; status: string }[] = []
  for (const event of REPLIERS_EVENTS) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/repliers/${event}`
    try {
      const response = await fetch(`${config.repliers.base_url}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'REPLIERS-API-KEY': apiKey
        },
        body: JSON.stringify({
          // Repliers event names are dot-separated (listings.create);
          // our routes are kebab-case — map <entity>-<action> accordingly.
          event: toRepliersEventName(event),
          target_url: targetUrl
        })
      })
      const body = await response.text()
      results.push({
        event,
        targetUrl,
        status: response.ok
          ? `OK ${response.status}`
          : `FAIL ${response.status}: ${body.slice(0, 120)}`
      })
    } catch (err) {
      results.push({
        event,
        targetUrl,
        status: `ERROR ${err instanceof Error ? err.message : String(err)}`
      })
    }
  }

  console.table(results)
  const failed = results.filter((r) => !r.status.startsWith('OK'))
  process.exit(failed.length > 0 ? 1 : 0)
}

/** favorite-created → favorites.create, search-match-created → searchmatches.create, ... */
function toRepliersEventName(event: string): string {
  const parts = event.split('-')
  const action = parts.pop() as string
  const entity = parts.join('')
  const actionMap: Record<string, string> = {
    created: 'create',
    updated: 'update',
    deleted: 'delete'
  }
  const entityMap: Record<string, string> = {
    listing: 'listings',
    favorite: 'favorites',
    search: 'searches',
    searchmatch: 'searchmatches',
    client: 'clients',
    message: 'messages',
    agent: 'agents'
  }
  return `${entityMap[entity] ?? entity}.${actionMap[action] ?? action}`
}

main().catch((err) => {
  console.error('subscribe-repliers-webhooks failed:', err)
  process.exit(1)
})
