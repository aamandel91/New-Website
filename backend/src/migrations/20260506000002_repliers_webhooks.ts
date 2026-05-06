import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS repliers_webhooks (
      id BIGSERIAL PRIMARY KEY,
      webhook_id BIGINT NOT NULL UNIQUE,
      event VARCHAR(64) NOT NULL,
      target_url VARCHAR(512) NOT NULL,
      hook_secret VARCHAR(128) NOT NULL,
      configuration JSONB NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS repliers_webhooks_event_idx
      ON repliers_webhooks (event)
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS repliers_webhook_events (
      id BIGSERIAL PRIMARY KEY,
      webhook_subscription_id BIGINT NULL REFERENCES repliers_webhooks(id) ON DELETE SET NULL,
      event VARCHAR(64) NOT NULL,
      payload JSONB NOT NULL,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      status VARCHAR(32) DEFAULT 'received'
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS repliers_webhook_events_event_idx
      ON repliers_webhook_events (event)
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS repliers_webhook_events_unprocessed_idx
      ON repliers_webhook_events (status) WHERE status = 'received'
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP TABLE IF EXISTS repliers_webhook_events`)
  await knex.schema.raw(`DROP TABLE IF EXISTS repliers_webhooks`)
}
