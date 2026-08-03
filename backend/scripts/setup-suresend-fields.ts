/**
 * Idempotently creates the portal's SureSend custom fields:
 *
 *   portal_price_band          dropdown: Under $500K, $500K-$1M, $1M+
 *   portal_last_favorite_date  date
 *   portal_search_cities       multi_select of the Broward + Palm Beach
 *                              cities this repo already serves
 *                              (backend/src/config/activeMarkets.ts)
 *   portal_engagement_score    number
 *
 * Checks listCustomFields first and only creates the missing ones.
 *
 * Run with:
 *   cd backend
 *   npx tsx scripts/setup-suresend-fields.ts
 */
import 'reflect-metadata'
import '../src/providers/index.js'
import { container } from 'tsyringe'
import SureSendService from '../src/services/suresend/client.js'
import type { SureSendCustomFieldInput } from '../src/services/suresend/types.js'
import { activeCities } from '../src/config/activeMarkets.js'

async function main() {
  const suresend = container.resolve(SureSendService)
  if (!suresend.enabled) {
    console.error('SURESEND_API_TOKEN is not set — aborting.')
    process.exit(1)
  }

  const searchCities = activeCities
    .filter((c) => c.county === 'Broward' || c.county === 'Palm Beach')
    .map((c) => c.name)

  const wanted: SureSendCustomFieldInput[] = [
    {
      name: 'portal_price_band',
      type: 'dropdown',
      options: ['Under $500K', '$500K-$1M', '$1M+']
    },
    { name: 'portal_last_favorite_date', type: 'date' },
    {
      name: 'portal_search_cities',
      type: 'multi_select',
      options: searchCities
    },
    { name: 'portal_engagement_score', type: 'number' }
  ]

  const existing = await suresend.listCustomFields()
  const existingNames = new Set(
    (existing.data ?? []).map((f) => f.name.toLowerCase())
  )

  for (const field of wanted) {
    if (existingNames.has(field.name.toLowerCase())) {
      console.log(`✓ ${field.name} already exists — skipping`)
      continue
    }
    const created = await suresend.createCustomField(field)
    console.log(`+ created ${field.name} (id ${created.data?.id ?? 'unknown'})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('setup-suresend-fields failed:', err)
  process.exit(1)
})
