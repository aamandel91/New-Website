import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import RepliersService from './repliers.js'
import { tenant as backendTenant } from '../config/tenant.config.js'
import type {
  SeoMetaTemplate,
  SeoMetaTemplateUpsertInput,
  SeoPageType,
  TemplateContext,
  PreviewResult
} from '../types/seoMetaTemplates.js'
import { SEO_PAGE_TYPES } from '../types/seoMetaTemplates.js'

// Minimal subtype slug → label/filter map. Kept independent of the frontend
// config; if the frontend list grows, the lookup just falls back to the slug.
interface SubTypeFilter {
  label: string
  labelSingular: string
  propertyType?: string
  type?: string
  class?: string
}
const SUBTYPE_LOOKUP: Record<string, SubTypeFilter> = {
  'single-family-homes': {
    label: 'Single Family Homes',
    labelSingular: 'Single Family Home',
    propertyType: 'Detached'
  },
  condos: {
    label: 'Condos',
    labelSingular: 'Condo',
    propertyType: 'Apartment'
  },
  townhomes: {
    label: 'Townhomes',
    labelSingular: 'Townhome',
    propertyType: 'Att/Row/Twnhouse'
  },
  'multi-family': {
    label: 'Multi-Family Homes',
    labelSingular: 'Multi-Family Home',
    propertyType: 'Multi-Family'
  },
  luxury: { label: 'Luxury Homes', labelSingular: 'Luxury Home' },
  waterfront: { label: 'Waterfront Homes', labelSingular: 'Waterfront Home' },
  'pool-homes': { label: 'Pool Homes', labelSingular: 'Pool Home' },
  'new-construction': {
    label: 'New Construction Homes',
    labelSingular: 'New Construction Home'
  },
  '55-plus': { label: '55+ Communities', labelSingular: '55+ Community' },
  'gated-communities': {
    label: 'Gated Communities',
    labelSingular: 'Gated Community'
  },
  'no-hoa': { label: 'No HOA Homes', labelSingular: 'No HOA Home' },
  rentals: { label: 'Rentals', labelSingular: 'Rental' },
  land: { label: 'Lots & Land', labelSingular: 'Lot' }
}
function getSubTypeBySlug(slug: string): SubTypeFilter | undefined {
  return SUBTYPE_LOOKUP[slug]
}

const TABLE = 'seo_meta_templates'
const CACHE_TTL_MS = 60 * 1000

// Defaults used when the row doesn't exist or the user clicks "reset".
// Kept in sync with the migration seeds.
const DEFAULTS: Record<
  SeoPageType,
  { title_template: string; description_template: string }
> = {
  city: {
    title_template: '{COUNT} Homes for Sale in {CITY}, {STATE} | {COMPANY}',
    description_template:
      'Browse {COUNT} homes for sale in {CITY}, {STATE_FULL}. View photos, prices, and property details. Updated daily by {COMPANY}.'
  },
  city_subtype: {
    title_template: '{SUBTYPE_PLURAL} for Sale in {CITY}, {STATE} | {COMPANY}',
    description_template:
      'Browse {COUNT} {SUBTYPE_PLURAL} for sale in {CITY}, {STATE_FULL}. View photos, prices, and property details. Updated daily by {COMPANY}.'
  },
  neighborhood: {
    title_template: 'Homes for Sale in {NEIGHBORHOOD}, {CITY}, {STATE}',
    description_template:
      'Browse homes for sale in the {NEIGHBORHOOD} neighborhood of {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  zipcode: {
    title_template: '{COUNT} Homes for Sale in {CITY}, {STATE} {ZIP}',
    description_template:
      'Browse {COUNT} homes for sale in {CITY}, {STATE_FULL} {ZIP}. View photos, prices, and property details. Updated daily by {COMPANY}.'
  },
  property_type: {
    title_template: '{SUBTYPE_PLURAL} for Sale in {STATE_FULL} | {COMPANY}',
    description_template:
      'Browse {SUBTYPE_PLURAL} for sale across {STATE_FULL}. View photos, prices, and property details. Updated daily on {COMPANY}.'
  },
  county: {
    title_template: 'Homes for Sale in {COUNTY} County, {STATE}',
    description_template:
      'Browse homes for sale in {COUNTY} County, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  school_elementary: {
    title_template: 'Homes Near {SCHOOL} Elementary School | {CITY}, {STATE}',
    description_template:
      'Browse homes for sale near {SCHOOL} Elementary School in {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  school_middle: {
    title_template: 'Homes Near {SCHOOL} Middle School | {CITY}, {STATE}',
    description_template:
      'Browse homes for sale near {SCHOOL} Middle School in {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  school_high: {
    title_template: 'Homes Near {SCHOOL} High School | {CITY}, {STATE}',
    description_template:
      'Browse homes for sale near {SCHOOL} High School in {CITY}, {STATE_FULL}. View photos, prices, and property details on {COMPANY}.'
  },
  school_district: {
    title_template: 'Homes in the {SCHOOL_DISTRICT} School District',
    description_template:
      'Browse homes for sale in the {SCHOOL_DISTRICT} school district. View photos, prices, and property details on {COMPANY}.'
  },
  popular_search: {
    title_template: '{POPULAR_SEARCH} | {COMPANY}',
    description_template:
      'Browse listings matching {POPULAR_SEARCH}. View photos, prices, and property details on {COMPANY}.'
  }
}

// Placeholders that require a live Repliers stats call. If a template contains
// any of these, we trigger the (cached) lookup before resolving.
const LIVE_PLACEHOLDERS = [
  '{COUNT}',
  '{AVG_PRICE}',
  '{MEDIAN_PRICE}',
  '{MIN_PRICE}',
  '{MAX_PRICE}'
]

interface LiveStats {
  count: number
  avg: number
  med: number
  min: number
  max: number
}

interface CacheEntry {
  value: LiveStats
  expiresAt: number
}

// Module-level cache shared across requests in a single process. The TTL is
// short (60s) so admin tweaks show up quickly without hammering Repliers.
const liveStatsCache = new Map<string, CacheEntry>()

function formatRow(row: any): SeoMetaTemplate {
  return {
    id: String(row.id),
    page_type: row.page_type,
    title_template: row.title_template,
    description_template: row.description_template,
    enabled: Boolean(row.enabled),
    updated_at: row.updated_at,
    updated_by_user_id:
      row.updated_by_user_id != null ? String(row.updated_by_user_id) : null
  }
}

function formatPrice(n: number | null | undefined): string {
  if (!n || !isFinite(n) || n <= 0) return ''
  return '$' + Math.round(n).toLocaleString('en-US')
}

function templateUsesLiveData(...templates: string[]): boolean {
  return templates.some((t) => LIVE_PLACEHOLDERS.some((p) => t.includes(p)))
}

@injectable()
export class SeoMetaTemplatesService {
  constructor(
    @inject('db') private db: Knex,
    @inject(RepliersService) private repliers: RepliersService
  ) {}

  async getAll(): Promise<SeoMetaTemplate[]> {
    const rows = await this.db(TABLE).select('*').orderBy('page_type', 'asc')
    return rows.map(formatRow)
  }

  async getByPageType(pageType: string): Promise<SeoMetaTemplate | null> {
    const row = await this.db(TABLE).where({ page_type: pageType }).first()
    return row ? formatRow(row) : null
  }

  async upsert(
    pageType: string,
    input: SeoMetaTemplateUpsertInput,
    userId?: number
  ): Promise<SeoMetaTemplate> {
    if (!SEO_PAGE_TYPES.includes(pageType as SeoPageType)) {
      throw new Error(`Unknown page_type: ${pageType}`)
    }
    const now = new Date()
    const data: Record<string, any> = {
      page_type: pageType,
      title_template: input.titleTemplate,
      description_template: input.descriptionTemplate,
      enabled: input.enabled !== false,
      updated_at: now
    }
    if (userId != null) data['updated_by_user_id'] = userId

    const existing = await this.db(TABLE).where({ page_type: pageType }).first()
    if (existing) {
      await this.db(TABLE).where({ page_type: pageType }).update(data)
    } else {
      await this.db(TABLE).insert(data)
    }
    const row = await this.db(TABLE).where({ page_type: pageType }).first()
    return formatRow(row)
  }

  async resetToDefault(pageType: string): Promise<SeoMetaTemplate> {
    if (!SEO_PAGE_TYPES.includes(pageType as SeoPageType)) {
      throw new Error(`Unknown page_type: ${pageType}`)
    }
    const def = DEFAULTS[pageType as SeoPageType]
    return this.upsert(pageType, {
      titleTemplate: def.title_template,
      descriptionTemplate: def.description_template,
      enabled: true
    })
  }

  /**
   * Replace `{TOKEN}` substrings using the context values. Unknown placeholders
   * are intentionally left in place so admins can see they typed a bad token
   * rather than getting silent empty strings. Empty/undefined context values
   * become empty strings (with light surrounding-whitespace cleanup).
   */
  resolveTemplate(template: string, context: TemplateContext): string {
    if (!template) return ''
    const lookup = context as Record<string, string | undefined>
    const result = template.replace(/\{([A-Z_]+)\}/g, (match, key) => {
      const val = lookup[key]
      if (val === undefined) return match
      return val
    })
    // Tidy up double-spaces and orphan punctuation created when a placeholder
    // resolves to an empty string (e.g. "in , FL" → "in FL").
    return result
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,/g, ',')
      .replace(/\(\s*\)/g, '')
      .trim()
  }

  /**
   * Build a TemplateContext suited to the page type, merging caller-supplied
   * scope (city, subType, etc.) with live stats from Repliers when required.
   * Live stats are looked up via the 60s in-memory cache.
   */
  async buildContext(
    pageType: SeoPageType,
    scope: {
      city?: string
      cityDisplay?: string
      stateAbbr?: string
      stateFull?: string
      county?: string
      neighborhood?: string
      zip?: string
      subTypeSlug?: string
      school?: string
      schoolDistrict?: string
      popularSearch?: string
      companyName?: string
    },
    template?: { title_template: string; description_template: string }
  ): Promise<TemplateContext> {
    const ctx: TemplateContext = {}
    const cityVal = scope.cityDisplay || scope.city
    if (cityVal) ctx.CITY = cityVal
    ctx.STATE = scope.stateAbbr ?? 'FL'
    ctx.STATE_FULL = scope.stateFull ?? 'Florida'
    if (scope.county) ctx.COUNTY = scope.county
    if (scope.neighborhood) {
      ctx.NEIGHBORHOOD = scope.neighborhood
      ctx.COMMUNITY = scope.neighborhood
    }
    if (scope.zip) ctx.ZIP = scope.zip
    if (scope.subTypeSlug) {
      const subType = getSubTypeBySlug(scope.subTypeSlug)
      if (subType) {
        ctx.SUBTYPE_PLURAL = subType.label
        ctx.SUBTYPE = subType.labelSingular || subType.label.replace(/s$/, '')
      } else {
        ctx.SUBTYPE_PLURAL = scope.subTypeSlug
        ctx.SUBTYPE = scope.subTypeSlug
      }
    }
    if (scope.school) ctx.SCHOOL = scope.school
    if (scope.schoolDistrict) ctx.SCHOOL_DISTRICT = scope.schoolDistrict
    if (scope.popularSearch) ctx.POPULAR_SEARCH = scope.popularSearch
    if (scope.companyName) ctx.COMPANY = scope.companyName

    // Only call Repliers when the template actually uses a live placeholder —
    // saves a network round-trip on every neighborhood/school render.
    const needsLive =
      !template ||
      templateUsesLiveData(
        template.title_template,
        template.description_template
      )
    if (needsLive) {
      const stats = await this.getLiveStats(pageType, scope)
      if (stats) {
        if (stats.count > 0) ctx.COUNT = stats.count.toLocaleString('en-US')
        const avg = formatPrice(stats.avg)
        if (avg) ctx.AVG_PRICE = avg
        const med = formatPrice(stats.med)
        if (med) ctx.MEDIAN_PRICE = med
        const min = formatPrice(stats.min)
        if (min) ctx.MIN_PRICE = min
        const max = formatPrice(stats.max)
        if (max) ctx.MAX_PRICE = max
      }
    }

    return ctx
  }

  private cacheKey(
    pageType: SeoPageType,
    scope: {
      city?: string
      zip?: string
      subTypeSlug?: string
      neighborhood?: string
    }
  ): string {
    switch (pageType) {
      case 'city':
        return `city:${scope.city || ''}`
      case 'city_subtype':
        return `city_subtype:${scope.city || ''}:${scope.subTypeSlug || ''}`
      case 'neighborhood':
        return `neighborhood:${scope.city || ''}:${scope.neighborhood || ''}`
      case 'zipcode':
        return `zip:${scope.zip || ''}`
      case 'property_type':
        return `property_type:${scope.subTypeSlug || ''}`
      default:
        return `${pageType}:${scope.city || ''}`
    }
  }

  private async getLiveStats(
    pageType: SeoPageType,
    scope: {
      city?: string
      zip?: string
      subTypeSlug?: string
      neighborhood?: string
    }
  ): Promise<LiveStats | null> {
    const key = this.cacheKey(pageType, scope)
    const now = Date.now()
    const hit = liveStatsCache.get(key)
    if (hit && hit.expiresAt > now) return hit.value

    try {
      const params: Record<string, any> = {
        status: 'A',
        resultsPerPage: 1,
        listings: false,
        statistics:
          'avg-listPrice,med-listPrice,min-listPrice,max-listPrice,cnt-listPrice'
      }
      if (scope.city) params['city'] = scope.city
      if (scope.zip) params['address.zip'] = scope.zip
      if (scope.neighborhood) params['neighborhood'] = scope.neighborhood
      if (scope.subTypeSlug) {
        const subType = getSubTypeBySlug(scope.subTypeSlug)
        if (subType) {
          if (subType.propertyType)
            params['propertyType'] = subType.propertyType
          if (subType.type) params['type'] = subType.type
          if (subType.class) params['class'] = subType.class
        }
      }

      const response: any = await this.repliers.listings.search(params)
      const stats =
        response?.statistics?.listPrice ?? response?.statistics?.soldPrice ?? {}
      const count = Number(response?.count ?? 0)
      const value: LiveStats = {
        count: isFinite(count) ? count : 0,
        avg: Number(stats?.avg ?? 0),
        med: Number(stats?.med ?? 0),
        min: Number(stats?.min ?? 0),
        max: Number(stats?.max ?? 0)
      }
      liveStatsCache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
      return value
    } catch (err) {
      // Repliers down / 5xx — don't poison the cache and don't fail the render.
      console.error('[SeoMetaTemplatesService] getLiveStats failed', err)
      return null
    }
  }

  /**
   * Sample data used by the admin preview pane — gives admins a sense of what
   * the rendered title/description looks like without hitting Repliers.
   */
  async getSampleContextForPageType(
    pageType: SeoPageType
  ): Promise<TemplateContext> {
    const base: TemplateContext = {
      CITY: 'Boca Raton',
      STATE: 'FL',
      STATE_FULL: 'Florida',
      COUNTY: 'Palm Beach',
      COMPANY: backendTenant.brand.teamName
    }
    switch (pageType) {
      case 'city':
        return {
          ...base,
          COUNT: '1,247',
          AVG_PRICE: '$985,000',
          MEDIAN_PRICE: '$720,000',
          MIN_PRICE: '$185,000',
          MAX_PRICE: '$12,500,000'
        }
      case 'city_subtype':
        return {
          ...base,
          SUBTYPE: 'Condo',
          SUBTYPE_PLURAL: 'Condos',
          COUNT: '524',
          AVG_PRICE: '$640,000',
          MEDIAN_PRICE: '$485,000',
          MIN_PRICE: '$165,000',
          MAX_PRICE: '$4,200,000'
        }
      case 'neighborhood':
        return {
          ...base,
          NEIGHBORHOOD: 'Country Isles',
          COMMUNITY: 'Country Isles',
          COUNT: '38',
          AVG_PRICE: '$875,000'
        }
      case 'zipcode':
        return {
          ...base,
          CITY: 'Boca Raton',
          ZIP: '33433',
          COUNT: '312',
          AVG_PRICE: '$540,000',
          MEDIAN_PRICE: '$465,000'
        }
      case 'property_type': {
        const { CITY: _drop1, ...rest } = base
        return {
          ...rest,
          SUBTYPE: 'Condo',
          SUBTYPE_PLURAL: 'Condos',
          COUNT: '4,820',
          AVG_PRICE: '$612,000',
          MEDIAN_PRICE: '$450,000'
        }
      }
      case 'county': {
        const { CITY: _drop2, ...rest } = base
        return {
          ...rest,
          COUNTY: 'Palm Beach',
          COUNT: '8,142',
          AVG_PRICE: '$895,000'
        }
      }
      case 'school_elementary':
        return { ...base, SCHOOL: 'Calusa', COUNT: '24' }
      case 'school_middle':
        return { ...base, SCHOOL: 'Omni', COUNT: '18' }
      case 'school_high':
        return { ...base, SCHOOL: 'Boca Raton', COUNT: '52' }
      case 'school_district': {
        const { CITY: _drop3, ...rest } = base
        return { ...rest, SCHOOL_DISTRICT: 'Palm Beach County' }
      }
      case 'popular_search':
        return { ...base, POPULAR_SEARCH: 'Waterfront Condos Under $1M' }
      default:
        return base
    }
  }

  async preview(pageType: SeoPageType): Promise<PreviewResult> {
    const template = (await this.getByPageType(pageType)) || {
      title_template: DEFAULTS[pageType].title_template,
      description_template: DEFAULTS[pageType].description_template
    }
    const ctx = await this.getSampleContextForPageType(pageType)
    return {
      title: this.resolveTemplate(template.title_template, ctx),
      description: this.resolveTemplate(template.description_template, ctx),
      context: ctx
    }
  }

  /** Returns the seeded default (for the admin "reset" link or first render). */
  getDefault(
    pageType: SeoPageType
  ): { title_template: string; description_template: string } | null {
    return DEFAULTS[pageType] ?? null
  }
}
