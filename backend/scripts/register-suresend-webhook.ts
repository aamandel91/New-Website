/**
 * Creates the SureSend webhook subscription (peopleUpdated,
 * peopleStageUpdated, peopleTagsAdded) pointing at
 * <WEBHOOK_BASE_URL>/api/webhooks/suresend, then calls the test-webhook
 * endpoint to verify delivery.
 *
 * MANUAL STEP — run once:
 *   cd backend
 *   WEBHOOK_BASE_URL=https://<railway-backend-url> npx tsx scripts/register-suresend-webhook.ts
 *
 * The secretKey in the response is printed ONCE and cannot be retrieved
 * again — store it as SURESEND_WEBHOOK_SECRET immediately.
 */
import 'reflect-metadata'
import '../src/providers/index.js'
import { container } from 'tsyringe'
import type { AppConfig } from '../src/config.js'
import SureSendService from '../src/services/suresend/client.js'
import { SURESEND_EVENTS } from '../src/jobs/queues.js'

async function main() {
  const config = container.resolve<AppConfig>('config')
  const suresend = container.resolve(SureSendService)
  if (!suresend.enabled) {
    console.error('SURESEND_API_TOKEN is not set — aborting.')
    process.exit(1)
  }
  const baseUrl = config.integrations.webhook_base_url
  if (!baseUrl) {
    console.error(
      'WEBHOOK_BASE_URL is not set (public Railway URL of this backend) — aborting.'
    )
    process.exit(1)
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/webhooks/suresend`
  const created = await suresend.createWebhook({
    name: 'Portal backend (Repliers portal)',
    url,
    events: [...SURESEND_EVENTS]
  })

  const webhook = created.data
  console.log(`Webhook created: id=${webhook?.id} url=${url}`)
  if (webhook?.secretKey) {
    console.log('')
    console.log('════════════════════════════════════════════════════════════')
    console.log('  ⚠️  SECRET KEY — SHOWN ONCE, STORE IT NOW  ⚠️')
    console.log('')
    console.log(`  SURESEND_WEBHOOK_SECRET=${webhook.secretKey}`)
    console.log('')
    console.log('  Add it to the backend environment (Railway variables and')
    console.log('  backend/.env) IMMEDIATELY — it cannot be retrieved again,')
    console.log('  and inbound webhook deliveries are rejected without it.')
    console.log('════════════════════════════════════════════════════════════')
    console.log('')
  } else {
    console.warn(
      'No secretKey in the response — check the SureSend dashboard for the webhook secret.'
    )
  }

  if (webhook?.id) {
    console.log('Sending test delivery...')
    try {
      await suresend.testWebhook(webhook.id)
      console.log(
        'Test delivery requested. Check backend logs for [webhook:suresend].'
      )
    } catch (err) {
      console.warn(
        'Test delivery failed (the subscription itself was created):',
        err instanceof Error ? err.message : err
      )
    }
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('register-suresend-webhook failed:', err)
  process.exit(1)
})
