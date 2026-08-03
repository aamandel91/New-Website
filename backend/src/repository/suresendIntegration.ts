import type { Knex } from 'knex'
import { inject, injectable } from 'tsyringe'

declare module 'knex/types/tables.js' {
  export interface SureSendPersonMapTable {
    id: number
    tenant: string
    repliers_client_id: number | null
    suresend_person_id: string
    email: string
    created_at: Date
    updated_at: Date
  }

  export interface ProcessedWebhookEventTable {
    id: number
    source: 'repliers' | 'suresend'
    dedupe_key: string
    processed_at: Date
  }

  export interface PendingAlertTable {
    id: number
    tenant: string
    person_id: string
    channel: 'text' | 'email'
    payload: Record<string, unknown>
    reason: string
    created_at: Date
    sent_at: Date | null
  }

  export interface WebhookSecretTable {
    id: number
    source: string
    event: string
    secret: string
    created_at: Date
  }

  export interface PortalFavoriteTable {
    id: number
    tenant: string
    repliers_client_id: number
    mls_number: string
    created_at: Date
    removed_at: Date | null
  }

  export interface ListingStatusLogTable {
    id: number
    tenant: string
    mls_number: string
    previous_status: string | null
    new_status: string
    payload: Record<string, unknown> | null
    created_at: Date
  }

  interface Tables {
    suresend_person_map: SureSendPersonMapTable
    processed_webhook_events: ProcessedWebhookEventTable
    pending_alerts: PendingAlertTable
    webhook_secrets: WebhookSecretTable
    portal_favorites: PortalFavoriteTable
    listing_status_log: ListingStatusLogTable
  }
}

/**
 * Data access for the Repliers ↔ SureSend integration tables
 * (migration 20260803000000_suresend_integration).
 */
@injectable()
export class SureSendIntegrationRepository {
  constructor(
    @inject('db')
    private db: Knex
  ) {}

  // ─── Idempotency ───────────────────────────────────────────────

  /**
   * Records a dedupe key. Returns true when this is the first time we see
   * it (caller should process), false when it was already processed.
   */
  async markProcessed(
    source: 'repliers' | 'suresend',
    dedupeKey: string
  ): Promise<boolean> {
    const inserted = await this.db('processed_webhook_events')
      .insert({ source, dedupe_key: dedupeKey })
      .onConflict('dedupe_key')
      .ignore()
      .returning('id')
    return inserted.length > 0
  }

  /**
   * True when a processed event whose dedupe_key starts with `prefix`
   * exists since `since`. Used by search-deleted to skip the
   * portal-cooling tag when the client created another search today.
   */
  async hasProcessedSince(prefix: string, since: Date): Promise<boolean> {
    const row = await this.db('processed_webhook_events')
      .where('dedupe_key', 'like', `${prefix}%`)
      .where('processed_at', '>=', since)
      .first('id')
    return !!row
  }

  async processedCountSince(since: Date): Promise<number> {
    const row = await this.db('processed_webhook_events')
      .where('processed_at', '>=', since)
      .count<{ count: string }[]>('id as count')
    return parseInt(row[0]?.count ?? '0')
  }

  // ─── Person mapping ────────────────────────────────────────────

  async getPersonByEmail(tenant: string, email: string) {
    return this.db('suresend_person_map')
      .where({ tenant, email: email.toLowerCase() })
      .first()
  }

  async getPersonByClientId(tenant: string, repliersClientId: number) {
    return this.db('suresend_person_map')
      .where({ tenant, repliers_client_id: repliersClientId })
      .first()
  }

  async upsertPersonMap(params: {
    tenant: string
    email: string
    suresendPersonId: string
    repliersClientId?: number | null
  }) {
    return this.db('suresend_person_map')
      .insert({
        tenant: params.tenant,
        email: params.email.toLowerCase(),
        suresend_person_id: params.suresendPersonId,
        repliers_client_id: params.repliersClientId ?? null
      })
      .onConflict(['tenant', 'email'])
      .merge({
        suresend_person_id: params.suresendPersonId,
        ...(params.repliersClientId
          ? { repliers_client_id: params.repliersClientId }
          : {}),
        updated_at: this.db.fn.now()
      })
  }

  // ─── Pending alerts (SEND_LEAD_ALERTS=false log) ───────────────

  async insertPendingAlert(params: {
    tenant: string
    personId: string
    channel: 'text' | 'email'
    payload: Record<string, unknown>
    reason: string
  }) {
    return this.db('pending_alerts').insert({
      tenant: params.tenant,
      person_id: params.personId,
      channel: params.channel,
      payload: JSON.stringify(params.payload) as never,
      reason: params.reason
    })
  }

  async pendingAlertsCount(): Promise<number> {
    const row = await this.db('pending_alerts')
      .whereNull('sent_at')
      .count<{ count: string }[]>('id as count')
    return parseInt(row[0]?.count ?? '0')
  }

  // ─── Webhook secrets (Repliers handshake) ──────────────────────

  async saveWebhookSecret(source: string, event: string, secret: string) {
    return this.db('webhook_secrets')
      .insert({ source, event, secret })
      .onConflict(['source', 'event'])
      .merge({ secret })
  }

  async getWebhookSecret(source: string, event: string) {
    return this.db('webhook_secrets').where({ source, event }).first()
  }

  async listWebhookSecrets() {
    return this.db('webhook_secrets')
      .select('source', 'event', 'created_at')
      .orderBy(['source', 'event'])
  }

  // ─── Portal favorites (local fan index) ────────────────────────

  async addFavorite(params: {
    tenant: string
    repliersClientId: number
    mlsNumber: string
  }) {
    return this.db('portal_favorites').insert({
      tenant: params.tenant,
      repliers_client_id: params.repliersClientId,
      mls_number: params.mlsNumber
    })
  }

  async markFavoriteRemoved(params: {
    tenant: string
    repliersClientId: number
    mlsNumber: string
  }) {
    return this.db('portal_favorites')
      .where({
        tenant: params.tenant,
        repliers_client_id: params.repliersClientId,
        mls_number: params.mlsNumber
      })
      .whereNull('removed_at')
      .update({ removed_at: this.db.fn.now() })
  }

  async activeFavoritesCount(
    tenant: string,
    repliersClientId: number
  ): Promise<number> {
    const row = await this.db('portal_favorites')
      .where({ tenant, repliers_client_id: repliersClientId })
      .whereNull('removed_at')
      .count<{ count: string }[]>('id as count')
    return parseInt(row[0]?.count ?? '0')
  }

  async recentFavoritesCount(
    tenant: string,
    repliersClientId: number,
    since: Date
  ): Promise<number> {
    const row = await this.db('portal_favorites')
      .where({ tenant, repliers_client_id: repliersClientId })
      .where('created_at', '>=', since)
      .count<{ count: string }[]>('id as count')
    return parseInt(row[0]?.count ?? '0')
  }

  /** Clients that currently favorite the given listing ("fans"). */
  async fansOfListing(tenant: string, mlsNumber: string): Promise<number[]> {
    const rows = await this.db('portal_favorites')
      .where({ tenant, mls_number: mlsNumber })
      .whereNull('removed_at')
      .distinct('repliers_client_id')
    return rows.map((r) => r.repliers_client_id)
  }

  // ─── Listing status log (prospecting pipeline) ─────────────────

  async logListingStatus(params: {
    tenant: string
    mlsNumber: string
    previousStatus: string | null
    newStatus: string
    payload?: Record<string, unknown>
  }) {
    return this.db('listing_status_log').insert({
      tenant: params.tenant,
      mls_number: params.mlsNumber,
      previous_status: params.previousStatus,
      new_status: params.newStatus,
      payload: params.payload ? (JSON.stringify(params.payload) as never) : null
    })
  }
}
