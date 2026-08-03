import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import PersonMapService from '../lib/personMap.js'
import LeadAlertService from '../lib/alerts.js'
import { formatPrice, listingUrl, payloadHash } from '../lib/portal.js'
import {
  clientId,
  listingDetails,
  mlsNumber,
  type WebhookPayload
} from '../lib/payload.js'
import { tenant } from '../../config/tenant.config.js'

/**
 * repliers.search-match-created / search-match-updated
 *
 * A listing matched a client's saved search. The lead-facing alert (text +
 * email with photo, price, address, link) is gated by SEND_LEAD_ALERTS via
 * LeadAlertService; the CRM note is always written.
 */
@injectable()
export default class RepliersSearchMatchWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository,
    private personMap: PersonMapService,
    private alerts: LeadAlertService
  ) {}

  async created(payload: WebhookPayload): Promise<void> {
    await this.handle(payload, 'search-match-created')
  }

  async updated(payload: WebhookPayload): Promise<void> {
    await this.handle(payload, 'search-match-updated')
  }

  private async handle(
    payload: WebhookPayload,
    event: 'search-match-created' | 'search-match-updated'
  ): Promise<void> {
    const client = clientId(payload)
    const mls = mlsNumber(payload)
    if (!client || !mls) {
      this.logger.warn(
        { data: { client, mls, event } },
        `[repliers.${event}]: missing clientId or mlsNumber; skipping`
      )
      return
    }
    const key = `${event}:${client}:${mls}:${payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = await this.personMap.findByClientId(client)
    if (!personId) {
      this.logger.info(
        { data: { client, mls } },
        `[repliers.${event}]: client not mapped to SureSend; skipping`
      )
      return
    }

    const details = listingDetails(payload)
    const url = listingUrl(mls)
    const price = formatPrice(details.price)
    const address = details.address ?? `MLS #${mls}`

    if (event === 'search-match-created') {
      await this.alerts.text({
        personId,
        message: `New match for your saved search: ${address} at ${price}. Take a look: ${url}`,
        reason: `search-match ${mls}`
      })
      await this.alerts.email({
        personId,
        subject: `New listing matches your search: ${address}`,
        body: [
          details.imageUrl
            ? `<p><img src="${details.imageUrl}" alt="${address}" style="max-width:100%"/></p>`
            : '',
          `<p>A new listing matches your saved search on ${tenant.brand.siteName}:</p>`,
          `<p><strong>${address}</strong><br/>${price}${details.bedrooms ? ` · ${details.bedrooms} bd` : ''}${details.bathrooms ? ` · ${details.bathrooms} ba` : ''}${details.sqft ? ` · ${details.sqft.toLocaleString('en-US')} sqft` : ''}</p>`,
          `<p><a href="${url}">View the listing</a></p>`
        ]
          .filter(Boolean)
          .join('\n'),
        reason: `search-match ${mls}`
      })
    }

    await this.suresend.createNote({
      personId,
      subject:
        event === 'search-match-created'
          ? 'Saved search match'
          : 'Saved search match updated',
      body: `${address} (${price}) matched this contact's saved search. ${url}`
    })
  }
}
