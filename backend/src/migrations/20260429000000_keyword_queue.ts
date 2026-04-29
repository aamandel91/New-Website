import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('keyword_queue', table => {
    table.bigIncrements('id').primary()
    table.string('keyword', 255).notNullable()
    table.string('city', 100).nullable()
    table.string('status', 50).defaultTo('pending') // 'pending' | 'generating' | 'done' | 'failed'
    table.integer('priority').defaultTo(0)
    table.bigInteger('blog_post_id').nullable().references('id').inTable('blogs')
    table.string('target_url', 255).nullable()
    table.text('notes').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    table.index('status', 'idx_keyword_queue_status')
    table.index(['priority', 'created_at'], 'idx_keyword_queue_priority_created')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('keyword_queue')
}
