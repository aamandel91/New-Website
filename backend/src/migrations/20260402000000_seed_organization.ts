import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Update default organization with FloridaHomeFinder branding
  await knex.raw(`
    UPDATE organizations
    SET
      name = 'Florida Home Finder',
      plan = 'enterprise',
      status = 'active',
      primary_domain = 'localhost',
      contact_email = 'andy@mandelteam.com',
      contact_phone = '(954) 555-0123',
      primary_color = '#0F1621',
      secondary_color = '#C4A96E',
      settings = '{"brandName": "Florida Home Finder", "mls_board_id": 110}'::jsonb
    WHERE slug = 'default'
  `)

  // Add the admin user as an organization member
  await knex.raw(`
    INSERT INTO organization_members (org_id, email, role, joined_at)
    SELECT id, 'andy@mandelteam.com', 'owner', CURRENT_TIMESTAMP
    FROM organizations WHERE slug = 'default'
    ON CONFLICT (org_id, email) DO NOTHING
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `DELETE FROM organization_members WHERE email = 'andy@mandelteam.com'`
  )
  await knex.raw(`
    UPDATE organizations
    SET
      name = 'Default Organization',
      contact_email = NULL,
      contact_phone = NULL,
      primary_color = '#1976d2',
      secondary_color = '#dc004e',
      settings = '{}'::jsonb
    WHERE slug = 'default'
  `)
}
