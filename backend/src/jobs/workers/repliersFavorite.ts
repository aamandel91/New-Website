import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import PersonMapService from '../lib/personMap.js'
import {
  TENANT,
  communityTag,
  formatPrice,
  listingUrl,
  payloadHash
} from '../lib/portal.js'
import {
  clientId,
  listingDetails,
  mlsNumber,
  type WebhookPayload
} from '../lib/payload.js'

const HOT_SHOPPING_WINDOW_MS = 30 * 60 * 1000
const HOT_SHOPPING_THRESHOLD = 3

/**
 * repliers.favorite-created / favorite-deleted
 *
 * Every favorite is logged locally in portal_favorites (so listing-updated
 * can find fans of an mlsNumber) and mirrored to SureSend as a
 * property_view event with favorite metadata. 3+ favorites within 30
 * minutes flags the person hot-shopping-now and opens a call task.
 */
@injectable()
export default class RepliersFavoriteWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository,
    private personMap: PersonMapService
  ) {}

  async created(payload: WebhookPayload): Promise<void> {
    const client = clientId(payload)
    const mls = mlsNumber(payload)
    if (!client || !mls) {
      this.logger.warn(
        { data: { client, mls } },
        '[repliers.favorite-created]: missing clientId or mlsNumber; skipping'
      )
      return
    }
    const key = `favorite-created:${client}:${mls}:${payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    await this.repo.addFavorite({
      tenant: TENANT,
      repliersClientId: client,
      mlsNumber: mls
    })

    const personId = await this.personMap.findByClientId(client)
    if (!personId) {
      this.logger.info(
        { data: { client, mls } },
        '[repliers.favorite-created]: client not mapped to SureSend yet; local log only'
      )
      return
    }

    const details = listingDetails(payload)
    await this.suresend.createEvent({
      type: 'property_view',
      personId,
      property: {
        mlsNumber: mls,
        address: details.address,
        price: details.price,
        bedrooms: details.bedrooms,
        bathrooms: details.bathrooms,
        sqft: details.sqft,
        url: listingUrl(mls),
        imageUrl: details.imageUrl
      },
      metadata: { action: 'favorited' }
    })

    const tags = ['portal-favorite']
    const community = communityTag(details.neighborhood ?? details.city)
    if (community) tags.push(community)
    await this.suresend.applyTags(personId, tags)

    const since = new Date(Date.now() - HOT_SHOPPING_WINDOW_MS)
    const recent = await this.repo.recentFavoritesCount(TENANT, client, since)
    if (recent >= HOT_SHOPPING_THRESHOLD) {
      await this.suresend.applyTags(personId, ['hot-shopping-now'])
      await this.suresend.createTask({
        personId,
        name: `Hot shopper: ${recent} favorites in the last 30 minutes — call now`,
        type: 'call',
        dueDateTime: new Date().toISOString()
      })
    }
  }

  async deleted(payload: WebhookPayload): Promise<void> {
    const client = clientId(payload)
    const mls = mlsNumber(payload)
    if (!client || !mls) return
    const key = `favorite-deleted:${client}:${mls}:${payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    await this.repo.markFavoriteRemoved({
      tenant: TENANT,
      repliersClientId: client,
      mlsNumber: mls
    })

    const personId = await this.personMap.findByClientId(client)
    if (!personId) return

    const details = listingDetails(payload)
    await this.suresend.createNote({
      personId,
      subject: 'Removed a favorite',
      body: `Removed ${details.address ?? mls} (${formatPrice(details.price)}) from favorites. ${listingUrl(mls)}`
    })

    const remaining = await this.repo.activeFavoritesCount(TENANT, client)
    if (remaining === 0) {
      await this.suresend.applyTags(personId, ['portal-cooling'])
    }
  }
}
