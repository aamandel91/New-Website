import type { Knex } from 'knex'

/**
 * SureSend CRM integration tables.
 *
 * - suresend_person_map: local mapping between portal identities (repliers
 *   client id / email) and SureSend person ids, per tenant.
 * - processed_webhook_events: idempotency guard for inbound webhooks from
 *   both Repliers and SureSend (dedupe_key is unique).
 * - pending_alerts: lead-facing texts/emails held back while
 *   SEND_LEAD_ALERTS=false; workers log the would-be send here instead.
 * - webhook_secrets: X-Hook-Secret values captured during the Repliers
 *   per-event handshake (one row per source+event).
 * - portal_favorites: local log of favorite-created/deleted so
 *   listing-updated workers can find "fans" of an mlsNumber.
 * - listing_status_log: Expired/Withdrawn/Terminated transitions captured
 *   for the prospecting pipeline (no lead-facing action).
 *
 * NOTE: pg-boss manages its own `pgboss` schema outside knex on purpose —
 * do not add pg-boss tables here.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS suresend_person_map (
      id BIGSERIAL PRIMARY KEY,
      tenant VARCHAR(64) NOT NULL,
      repliers_client_id BIGINT NULL,
      suresend_person_id VARCHAR(128) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (tenant, email)
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS suresend_person_map_email_idx
      ON suresend_person_map (email)
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS suresend_person_map_repliers_client_idx
      ON suresend_person_map (repliers_client_id)
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS processed_webhook_events (
      id BIGSERIAL PRIMARY KEY,
      source VARCHAR(16) NOT NULL CHECK (source IN ('repliers', 'suresend')),
      dedupe_key VARCHAR(255) NOT NULL UNIQUE,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS pending_alerts (
      id BIGSERIAL PRIMARY KEY,
      tenant VARCHAR(64) NOT NULL,
      person_id VARCHAR(128) NOT NULL,
      channel VARCHAR(8) NOT NULL CHECK (channel IN ('text', 'email')),
      payload JSONB NOT NULL,
      reason VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP NULL
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS pending_alerts_unsent_idx
      ON pending_alerts (created_at) WHERE sent_at IS NULL
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS webhook_secrets (
      id BIGSERIAL PRIMARY KEY,
      source VARCHAR(32) NOT NULL,
      event VARCHAR(64) NOT NULL,
      secret VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (source, event)
    )
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS portal_favorites (
      id BIGSERIAL PRIMARY KEY,
      tenant VARCHAR(64) NOT NULL,
      repliers_client_id BIGINT NOT NULL,
      mls_number VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      removed_at TIMESTAMP NULL
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS portal_favorites_mls_active_idx
      ON portal_favorites (mls_number) WHERE removed_at IS NULL
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS portal_favorites_client_idx
      ON portal_favorites (repliers_client_id)
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS listing_status_log (
      id BIGSERIAL PRIMARY KEY,
      tenant VARCHAR(64) NOT NULL,
      mls_number VARCHAR(32) NOT NULL,
      previous_status VARCHAR(32) NULL,
      new_status VARCHAR(32) NOT NULL,
      payload JSONB NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS listing_status_log_mls_idx
      ON listing_status_log (mls_number)
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP TABLE IF EXISTS listing_status_log`)
  await knex.schema.raw(`DROP TABLE IF EXISTS portal_favorites`)
  await knex.schema.raw(`DROP TABLE IF EXISTS webhook_secrets`)
  await knex.schema.raw(`DROP TABLE IF EXISTS pending_alerts`)
  await knex.schema.raw(`DROP TABLE IF EXISTS processed_webhook_events`)
  await knex.schema.raw(`DROP TABLE IF EXISTS suresend_person_map`)
}
