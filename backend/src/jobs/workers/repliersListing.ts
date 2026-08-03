import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import PersonMapService from '../lib/personMap.js'
import LeadAlertService from '../lib/alerts.js'
import { TENANT, formatPrice, listingUrl, payloadHash } from '../lib/portal.js'
import {
  listPrice,
  listingDetails,
  listingStatus,
  mlsNumber,
  previous,
  updatedOn,
  type WebhookPayload
} from '../lib/payload.js'

const TASK_DUE_OFFSET_MS = 2 * 60 * 60 * 1000 // call tasks due +2h

type NormalizedStatus =
  | 'active'
  | 'pending'
  | 'sold'
  | 'expired'
  | 'withdrawn'
  | 'terminated'
  | 'unknown'

/**
 * Maps the many Repliers status/lastStatus spellings (long names and MLS
 * short codes alike) onto the transitions we act on.
 */
export function normalizeStatus(status: string | undefined): NormalizedStatus {
  const s = (status ?? '').toLowerCase()
  if (['active', 'a', 'new', 'act', 'pc', 'ext', 'bom'].includes(s)) {
    return 'active'
  }
  if (['pending', 'pnd', 'p', 'sc', 'lc', 'cs'].includes(s)) return 'pending'
  if (['sold', 'sld', 'cld', 'lsd'].includes(s)) return 'sold'
  if (['expired', 'exp'].includes(s)) return 'expired'
  if (['withdrawn', 'wth', 'sus', 'suspended'].includes(s)) return 'withdrawn'
  if (['terminated', 'ter'].includes(s)) return 'terminated'
  return 'unknown'
}

const PROSPECTING_STATUSES: NormalizedStatus[] = [
  'expired',
  'withdrawn',
  'terminated'
]

/**
 * repliers.listing-created / listing-updated / listing-deleted
 *
 * listing-updated branches on the `previous` object: price drops and
 * Active↔Pending/Sold transitions fan out to local favorites ("fans") with
 * flag-gated lead alerts plus always-on tasks and notes.
 * Expired/Withdrawn/Terminated go to listing_status_log for the
 * prospecting pipeline with no lead-facing action. There is no local
 * listings store in this repo (listings are fetched live from the Repliers
 * API), so created/deleted only maintain fan bookkeeping.
 */
@injectable()
export default class RepliersListingWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository,
    private personMap: PersonMapService,
    private alerts: LeadAlertService
  ) {}

  private dedupeKey(event: string, payload: WebhookPayload): string {
    const mls = mlsNumber(payload) ?? 'unknown'
    return `${event}:${mls}:${updatedOn(payload) ?? payloadHash(payload)}`
  }

  async created(payload: WebhookPayload): Promise<void> {
    const key = this.dedupeKey('listing-created', payload)
    if (!(await this.repo.markProcessed('repliers', key))) return
    // No local listings store to update — listings are served live from the
    // Repliers API. Log for observability.
    this.logger.info(
      { data: { mlsNumber: mlsNumber(payload) } },
      '[repliers.listing-created]: received'
    )
  }

  async updated(payload: WebhookPayload): Promise<void> {
    const mls = mlsNumber(payload)
    if (!mls) {
      this.logger.warn('[repliers.listing-updated]: no mlsNumber; skipping')
      return
    }
    const key = this.dedupeKey('listing-updated', payload)
    if (!(await this.repo.markProcessed('repliers', key))) return

    const prev = previous(payload)
    if (!prev) {
      this.logger.info(
        { data: { mlsNumber: mls } },
        '[repliers.listing-updated]: no previous object; nothing to compare'
      )
      return
    }

    const details = listingDetails(payload)
    const address = details.address ?? `MLS #${mls}`
    const url = listingUrl(mls)

    // ── Price drop ──────────────────────────────────────────────
    const prevPrice = listPrice(prev)
    const newPrice = listPrice(payload)
    if (prevPrice && newPrice && newPrice < prevPrice) {
      const drop = prevPrice - newPrice
      await this.notifyFans(mls, {
        text: `Price drop on ${address}: now ${formatPrice(newPrice)} (down ${formatPrice(drop)}). ${url}`,
        reason: `price-drop ${mls}`,
        taskName: `Price drop on favorited ${address} (−${formatPrice(drop)}) — call`,
        noteSubject: 'Price drop on favorited listing',
        noteBody: `${address} dropped from ${formatPrice(prevPrice)} to ${formatPrice(newPrice)} (−${formatPrice(drop)}). ${url}`
      })
    }

    // ── Status transitions ──────────────────────────────────────
    const prevStatus = normalizeStatus(listingStatus(prev))
    const newStatus = normalizeStatus(listingStatus(payload))
    if (prevStatus === newStatus) return

    if (PROSPECTING_STATUSES.includes(newStatus)) {
      // Prospecting pipeline only — never lead-facing.
      await this.repo.logListingStatus({
        tenant: TENANT,
        mlsNumber: mls,
        previousStatus: listingStatus(prev) ?? null,
        newStatus: listingStatus(payload) ?? newStatus,
        payload: { address, price: newPrice ?? prevPrice }
      })
      return
    }

    if (prevStatus === 'active' && newStatus === 'pending') {
      await this.notifyFans(mls, {
        text: `${address} just went under contract. Want to see similar homes? ${url}`,
        reason: `status-pending ${mls}`,
        taskName: `Favorited ${address} went pending — call about alternatives`,
        noteSubject: 'Favorited listing went pending',
        noteBody: `${address} moved Active → Pending. ${url}`
      })
    } else if (prevStatus === 'pending' && newStatus === 'active') {
      await this.notifyFans(mls, {
        text: `Good news — ${address} is back on the market! ${url}`,
        reason: `back-on-market ${mls}`,
        taskName: `Favorited ${address} back on market — call now`,
        noteSubject: 'Favorited listing back on market',
        noteBody: `${address} moved Pending → Active (back on market). ${url}`
      })
    } else if (newStatus === 'sold') {
      await this.notifyFans(mls, {
        text: `${address} has sold${newPrice ? ` for ${formatPrice(newPrice)}` : ''}. Want to see what else is out there? ${url}`,
        reason: `status-sold ${mls}`,
        taskName: `Favorited ${address} sold — call about similar homes`,
        noteSubject: 'Favorited listing sold',
        noteBody: `${address} is now Sold${newPrice ? ` (${formatPrice(newPrice)})` : ''}. ${url}`
      })
    }
  }

  async deleted(payload: WebhookPayload): Promise<void> {
    const mls = mlsNumber(payload)
    if (!mls) return
    const key = this.dedupeKey('listing-deleted', payload)
    if (!(await this.repo.markProcessed('repliers', key))) return

    // Remove from lead-facing surfaces: mark local favorites of this
    // listing removed and note the affected fans.
    const fans = await this.repo.fansOfListing(TENANT, mls)
    const details = listingDetails(payload)
    const address = details.address ?? `MLS #${mls}`
    for (const fanClientId of fans) {
      await this.repo.markFavoriteRemoved({
        tenant: TENANT,
        repliersClientId: fanClientId,
        mlsNumber: mls
      })
      const personId = await this.personMap.findByClientId(fanClientId)
      if (personId) {
        await this.suresend.createNote({
          personId,
          subject: 'Favorited listing removed',
          body: `${address} was removed from the MLS feed and is no longer on the portal.`
        })
      }
    }
    this.logger.info(
      { data: { mlsNumber: mls, fans: fans.length } },
      '[repliers.listing-deleted]: favorites cleaned up'
    )
  }

  /**
   * Fans = clients with an active local favorite on this mlsNumber.
   * Text is flag-gated (LeadAlertService); task + note are always live.
   */
  private async notifyFans(
    mls: string,
    params: {
      text: string
      reason: string
      taskName: string
      noteSubject: string
      noteBody: string
    }
  ): Promise<void> {
    const fans = await this.repo.fansOfListing(TENANT, mls)
    for (const fanClientId of fans) {
      const personId = await this.personMap.findByClientId(fanClientId)
      if (!personId) continue
      await this.alerts.text({
        personId,
        message: params.text,
        reason: params.reason
      })
      await this.suresend.createTask({
        personId,
        name: params.taskName,
        type: 'call',
        dueDateTime: new Date(Date.now() + TASK_DUE_OFFSET_MS).toISOString()
      })
      await this.suresend.createNote({
        personId,
        subject: params.noteSubject,
        body: params.noteBody
      })
    }
    if (fans.length > 0) {
      this.logger.info(
        { data: { mlsNumber: mls, fans: fans.length, reason: params.reason } },
        '[repliers.listing-updated]: fans notified'
      )
    }
  }
}
