import type { Knex } from 'knex'

const DEFAULT_TEMPLATES: Array<{
  page_type: string
  title_template: string
  description_template: string
}> = [
  {
    page_type: 'city',
    title_template: '{COUNT} Homes for Sale in {CITY}, {STATE} | {COMPANY}',
    description_template:
      'Browse {COUNT} homes for sale in {CITY}, {STATE_FULL}. View photos, prices, and property details. Updated daily by {COMPANY}.'
  },
  {
    page_type: 'city_subtype',
    title_template: '{SUBTYPE_PLURAL} for Sale in {CITY}, {STATE} | {COMPANY}',
    description_template:
      'Browse {COUNT} {SUBTYPE_PLURAL} for sale in {CITY}, {STATE_FULL}. View photos, prices, and property details. Updated daily by {COMPANY}.'
  },
  {
    page_type: 'neighborhood',
    title_template: 'Homes for Sale in {NEIGHBORHOOD}, {CITY}, {STATE}',
    description_template:
      'Browse homes for sale in the {NEIGHBORHOOD} neighborhood of {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  {
    page_type: 'zipcode',
    title_template: '{COUNT} Homes for Sale in {CITY}, {STATE} {ZIP}',
    description_template:
      'Browse {COUNT} homes for sale in {CITY}, {STATE_FULL} {ZIP}. View photos, prices, and property details. Updated daily by {COMPANY}.'
  },
  {
    page_type: 'property_type',
    title_template: '{SUBTYPE_PLURAL} for Sale in {STATE_FULL} | {COMPANY}',
    description_template:
      'Browse {SUBTYPE_PLURAL} for sale across {STATE_FULL}. View photos, prices, and property details. Updated daily on {COMPANY}.'
  },
  {
    page_type: 'county',
    title_template: 'Homes for Sale in {COUNTY} County, {STATE}',
    description_template:
      'Browse homes for sale in {COUNTY} County, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  {
    page_type: 'school_elementary',
    title_template: 'Homes Near {SCHOOL} Elementary School | {CITY}, {STATE}',
    description_template:
      'Browse homes for sale near {SCHOOL} Elementary School in {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  {
    page_type: 'school_middle',
    title_template: 'Homes Near {SCHOOL} Middle School | {CITY}, {STATE}',
    description_template:
      'Browse homes for sale near {SCHOOL} Middle School in {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  {
    page_type: 'school_high',
    title_template: 'Homes Near {SCHOOL} High School | {CITY}, {STATE}',
    description_template:
      'Browse homes for sale near {SCHOOL} High School in {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  {
    page_type: 'school_district',
    title_template: 'Homes in the {SCHOOL_DISTRICT} School District',
    description_template:
      'Browse homes for sale in the {SCHOOL_DISTRICT} school district. View photos, prices, and property details on {COMPANY}.'
  },
  {
    page_type: 'popular_search',
    title_template: '{POPULAR_SEARCH} | {COMPANY}',
    description_template:
      'Browse listings matching {POPULAR_SEARCH}. View photos, prices, and property details on {COMPANY}.'
  }
]

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('seo_meta_templates', table => {
    table.bigIncrements('id').primary()
    table.string('page_type', 64).notNullable().unique()
    table.text('title_template').notNullable()
    table.text('description_template').notNullable()
    table.boolean('enabled').defaultTo(true)
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.bigInteger('updated_by_user_id').nullable()

    table.index('page_type', 'seo_meta_templates_page_type_idx')
  })

  await knex('seo_meta_templates').insert(
    DEFAULT_TEMPLATES.map(t => ({
      page_type: t.page_type,
      title_template: t.title_template,
      description_template: t.description_template,
      enabled: true,
      updated_at: new Date()
    }))
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('seo_meta_templates')
}
