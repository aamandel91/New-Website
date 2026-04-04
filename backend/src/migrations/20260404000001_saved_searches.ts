import crypto from 'node:crypto'
import { promisify } from 'node:util'
import type { Knex } from 'knex'

const scryptAsync = promisify(crypto.scrypt)

export async function up(knex: Knex): Promise<void> {
  // Site users table (home buyers/sellers — separate from admin_users)
  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS site_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      phone VARCHAR(50),
      password_hash TEXT,
      favorites JSONB DEFAULT '[]',
      search_history JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Saved searches table
  await knex.schema.raw(`
    CREATE TABLE saved_searches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES site_users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      filters JSONB NOT NULL,
      alert_frequency VARCHAR(20) DEFAULT 'daily',
      last_alerted_at TIMESTAMP,
      new_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Index for faster lookups
  await knex.schema.raw(`
    CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id)
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('saved_searches')
  await knex.schema.dropTableIfExists('site_users')
}
