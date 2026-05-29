import type { Knex } from 'knex'

/**
 * Track 3 (AI auto-tagging) columns.
 *
 * - suggested_tags: structured AI output ({ cities, neighborhoods, counties,
 *   topics, audience, seasonality, model, ran_at, token_usage, ... }).
 *   Distinct from the bool `ai_suggested_tags` flag (kept for backward compat).
 * - rejected_tags: tags the admin rejected, fed back to the AI as a
 *   "never suggest these" constraint on re-runs.
 * - auto_tagged_at: idempotency / rerun bookkeeping for the backfill script
 *   and the editor UI.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('blogs', table => {
    table.jsonb('suggested_tags').nullable()
    table.jsonb('rejected_tags').defaultTo('[]')
    table.timestamp('auto_tagged_at').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('blogs', table => {
    table.dropColumn('suggested_tags')
    table.dropColumn('rejected_tags')
    table.dropColumn('auto_tagged_at')
  })
}
