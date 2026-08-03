import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import PersonMapService from '../lib/personMap.js'
import {
  formatPrice,
  payloadHash,
  priceBandTag,
  searchUrl
} from '../lib/portal.js'
import {
  previous,
  searchDetails,
  type SearchDetails,
  type WebhookPayload
} from '../lib/payload.js'

const REQUALIFY_PRICE_JUMP = 1.15

/**
 * repliers.search-created / search-updated / search-deleted
 *
 * Saved searches become "Property Search" events with saved:true metadata
 * and price-band tags. A 15%+ maxPrice increase on update opens a
 * requalification call task. Deleting the last search of the day tags
 * portal-cooling.
 */
@injectable()
export default class RepliersSearchWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository,
    private personMap: PersonMapService
  ) {}

  private async resolvePerson(search: SearchDetails): Promise<string | null> {
    if (!search.clientId) return null
    return this.personMap.findByClientId(search.clientId)
  }

  private searchEventPayload(search: SearchDetails) {
    return {
      city: search.city,
      state: 'FL',
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      minBedrooms: search.minBedrooms,
      searchUrl: searchUrl({
        city: search.city,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        minBeds: search.minBedrooms
      })
    }
  }

  private async recordSearchEvent(
    personId: string,
    search: SearchDetails
  ): Promise<void> {
    await this.suresend.createEvent({
      type: 'Property Search',
      personId,
      propertySearch: this.searchEventPayload(search),
      metadata: { saved: true }
    })
    const tags = ['portal-saved-search']
    const band = priceBandTag(search.maxPrice ?? search.minPrice)
    if (band) tags.push(band)
    await this.suresend.applyTags(personId, tags)
  }

  async created(payload: WebhookPayload): Promise<void> {
    const search = searchDetails(payload)
    const key = `search-created:${search.clientId ?? 'unknown'}:${search.searchId ?? payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = await this.resolvePerson(search)
    if (!personId) {
      this.logger.info(
        { data: { clientId: search.clientId, searchId: search.searchId } },
        '[repliers.search-created]: client not mapped to SureSend; skipping'
      )
      return
    }
    await this.recordSearchEvent(personId, search)
  }

  async updated(payload: WebhookPayload): Promise<void> {
    const search = searchDetails(payload)
    const key = `search-updated:${search.searchId ?? 'unknown'}:${payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = await this.resolvePerson(search)
    if (!personId) return

    await this.recordSearchEvent(personId, search)

    const prev = previous(payload)
    const prevSearch = prev ? searchDetails(prev) : undefined
    const diff = describeCriteriaDiff(prevSearch, search)
    if (diff) {
      await this.suresend.createNote({
        personId,
        subject: 'Saved search updated',
        body: diff
      })
    }

    if (
      prevSearch?.maxPrice &&
      search.maxPrice &&
      search.maxPrice >= prevSearch.maxPrice * REQUALIFY_PRICE_JUMP
    ) {
      await this.suresend.createTask({
        personId,
        name: `Budget jumped from ${formatPrice(prevSearch.maxPrice)} to ${formatPrice(search.maxPrice)} — requalification call`,
        type: 'call',
        dueDateTime: new Date().toISOString()
      })
    }
  }

  async deleted(payload: WebhookPayload): Promise<void> {
    const search = searchDetails(payload)
    const key = `search-deleted:${search.searchId ?? payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = await this.resolvePerson(search)
    if (!personId) return

    await this.suresend.createNote({
      personId,
      subject: 'Saved search deleted',
      body: `Deleted saved search${search.city ? ` for ${search.city}` : ''}${
        search.maxPrice ? ` (max ${formatPrice(search.maxPrice)})` : ''
      }.`
    })

    // Skip portal-cooling if the client created another search today.
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const createdToday = search.clientId
      ? await this.repo.hasProcessedSince(
          `search-created:${search.clientId}:`,
          startOfDay
        )
      : false
    if (!createdToday) {
      await this.suresend.applyTags(personId, ['portal-cooling'])
    }
  }
}

function describeCriteriaDiff(
  prev: SearchDetails | undefined,
  next: SearchDetails
): string | null {
  if (!prev) return null
  const changes: string[] = []
  if (prev.city !== next.city) {
    changes.push(`city: ${prev.city ?? '—'} → ${next.city ?? '—'}`)
  }
  if (prev.minPrice !== next.minPrice) {
    changes.push(
      `min price: ${formatPrice(prev.minPrice)} → ${formatPrice(next.minPrice)}`
    )
  }
  if (prev.maxPrice !== next.maxPrice) {
    changes.push(
      `max price: ${formatPrice(prev.maxPrice)} → ${formatPrice(next.maxPrice)}`
    )
  }
  if (prev.minBedrooms !== next.minBedrooms) {
    changes.push(
      `min bedrooms: ${prev.minBedrooms ?? '—'} → ${next.minBedrooms ?? '—'}`
    )
  }
  if (changes.length === 0) return null
  return `Search criteria changed: ${changes.join('; ')}`
}
