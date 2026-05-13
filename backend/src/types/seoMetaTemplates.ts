export type SeoPageType =
  | 'city'
  | 'city_subtype'
  | 'neighborhood'
  | 'zipcode'
  | 'property_type'
  | 'county'
  | 'school_elementary'
  | 'school_middle'
  | 'school_high'
  | 'school_district'
  | 'popular_search'

export const SEO_PAGE_TYPES: SeoPageType[] = [
  'city',
  'city_subtype',
  'neighborhood',
  'zipcode',
  'property_type',
  'county',
  'school_elementary',
  'school_middle',
  'school_high',
  'school_district',
  'popular_search'
]

export const ACTIVE_SEO_PAGE_TYPES: SeoPageType[] = [
  'city',
  'city_subtype',
  'neighborhood',
  'zipcode',
  'property_type'
]

export interface SeoMetaTemplate {
  id: string
  page_type: SeoPageType
  title_template: string
  description_template: string
  enabled: boolean
  updated_at: Date
  updated_by_user_id: string | null
}

export interface SeoMetaTemplateUpsertInput {
  titleTemplate: string
  descriptionTemplate: string
  enabled?: boolean
}

export interface TemplateContext {
  CITY?: string
  STATE?: string
  STATE_FULL?: string
  COUNTY?: string
  NEIGHBORHOOD?: string
  COMMUNITY?: string
  ZIP?: string
  SUBTYPE?: string
  SUBTYPE_PLURAL?: string
  SCHOOL?: string
  SCHOOL_DISTRICT?: string
  POPULAR_SEARCH?: string
  COMPANY?: string
  COUNT?: string
  AVG_PRICE?: string
  MEDIAN_PRICE?: string
  MIN_PRICE?: string
  MAX_PRICE?: string
}

export interface PreviewResult {
  title: string
  description: string
  context: TemplateContext
}
