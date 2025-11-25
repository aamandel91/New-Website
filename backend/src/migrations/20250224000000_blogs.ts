import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('blogs', table => {
    table.bigIncrements('id').primary()
    table.string('slug').unique().notNullable() // SEO URL slug
    table.string('title').notNullable()
    table.text('description').notNullable() // Short excerpt/meta description
    table.text('content').notNullable() // Markdown content
    table.string('featured_image_url').nullable() // Cloudinary URL
    table.string('featured_image_cloudinary_id').nullable() // For deletion/updates
    table.string('author_email').notNullable() // Admin user email
    table.string('status').defaultTo('draft') // 'draft' | 'published'
    table.jsonb('tags').defaultTo('[]') // Array of tag strings
    table.jsonb('categories').defaultTo('[]') // Array of category strings

    // SEO Fields
    table.string('meta_title').nullable()
    table.string('meta_description').nullable()
    table.jsonb('meta_keywords').defaultTo('[]') // Array of keywords

    // AI Generated fields
    table.boolean('ai_suggested_meta').defaultTo(false) // Flag if meta was AI-generated
    table.boolean('ai_suggested_tags').defaultTo(false) // Flag if tags were AI-generated

    table.timestamp('published_at').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Indexes for performance
    table.index(['status', 'published_at'], 'idx_blogs_status_published')
    table.index(['author_email'], 'idx_blogs_author')
    table.index('slug', 'idx_blogs_slug')
  })

  // Create tags table for tag management
  await knex.schema.createTable('blog_tags', table => {
    table.increments('id').primary()
    table.string('name').unique().notNullable()
    table.string('slug').unique().notNullable()
    table.integer('usage_count').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.index('slug')
  })

  // Create categories table
  await knex.schema.createTable('blog_categories', table => {
    table.increments('id').primary()
    table.string('name').unique().notNullable()
    table.string('slug').unique().notNullable()
    table.text('description').nullable()
    table.integer('usage_count').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.index('slug')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blog_categories')
  await knex.schema.dropTableIfExists('blog_tags')
  await knex.schema.dropTableIfExists('blogs')
}
