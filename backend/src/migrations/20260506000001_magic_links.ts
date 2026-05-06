import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS magic_links (
      id BIGSERIAL PRIMARY KEY,
      token UUID NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
      purpose VARCHAR(64) NOT NULL,
      destination_path VARCHAR(512) NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL,
      invalidated_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS magic_links_token_idx ON magic_links (token)
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS magic_links_user_id_idx ON magic_links (user_id)
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS magic_links_active_idx
      ON magic_links (user_id) WHERE used_at IS NULL AND invalidated_at IS NULL
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP TABLE IF EXISTS magic_links`)
}
