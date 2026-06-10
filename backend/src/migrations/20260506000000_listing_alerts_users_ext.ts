import type { Knex } from 'knex'

/**
 * Adds Repliers client linkage to site_users and creates an agent_assignments
 * history table for multi-agent client assignment.
 *
 * site_users (the existing site-user table) is extended rather than the spec's
 * "users" name because that's the real table in this codebase.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE site_users
      ADD COLUMN IF NOT EXISTS repliers_client_id BIGINT NULL
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS site_users_repliers_client_id_idx
      ON site_users (repliers_client_id)
  `)

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS agent_assignments (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
      repliers_agent_id BIGINT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unassigned_at TIMESTAMP NULL,
      reason TEXT NULL
    )
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS agent_assignments_user_id_idx
      ON agent_assignments (user_id)
  `)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS agent_assignments_active_idx
      ON agent_assignments (user_id) WHERE unassigned_at IS NULL
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP TABLE IF EXISTS agent_assignments`)
  await knex.schema.raw(
    `DROP INDEX IF EXISTS site_users_repliers_client_id_idx`
  )
  await knex.schema.raw(
    `ALTER TABLE site_users DROP COLUMN IF EXISTS repliers_client_id`
  )
}
