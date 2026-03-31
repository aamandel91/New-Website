import type { ApiLastStatus } from 'services/API'

/**
 * Page generation configuration for Florida county/city/sub-type pages.
 * Defines target counties, property sub-types with search filters, and template variables.
 */

export const targetCounties = ['Broward', 'Palm Beach'] as const

export type TargetCounty = (typeof targetCounties)[number]

export interface SubTypeConfig {
  slug: string
  label: string
  filterType: 'residential' | 'condo' | 'rental' | 'land'
  propertyType?: string
  keywords?: string
  minPrice?: number
  stories?: number
  lastStatus?: ApiLastStatus
  minLotSize?: number
}

export const subTypes: SubTypeConfig[] = [
  { slug: 'single-family-homes', label: 'Single Family Homes', filterType: 'residential', propertyType: 'Detached' },
  { slug: 'condos', label: 'Condos', filterType: 'condo', propertyType: 'Apartment' },
  { slug: 'townhomes', label: 'Townhomes', filterType: 'residential', propertyType: 'Att/Row/Twnhouse' },
  { slug: 'multi-family', label: 'Multi-Family Homes', filterType: 'residential', propertyType: 'Multi-Family' },
  { slug: 'luxury', label: 'Luxury Homes', filterType: 'residential', minPrice: 1000000 },
  { slug: 'waterfront', label: 'Waterfront Homes', filterType: 'residential', keywords: 'waterfront' },
  { slug: 'pool-homes', label: 'Pool Homes', filterType: 'residential', keywords: 'pool' },
  { slug: 'new-construction', label: 'New Construction', filterType: 'residential', keywords: 'new construction' },
  { slug: '55-plus', label: '55+ Communities', filterType: 'residential', keywords: '55+' },
  { slug: 'gated-communities', label: 'Gated Communities', filterType: 'residential', keywords: 'gated' },
  { slug: 'no-hoa', label: 'No HOA Homes', filterType: 'residential', keywords: 'no hoa' },
  { slug: 'ocean-access', label: 'Ocean Access Homes', filterType: 'residential', keywords: 'ocean access' },
  { slug: 'country-club', label: 'Country Club Homes', filterType: 'residential', keywords: 'country club' },
  { slug: 'one-story', label: '1 Story Homes', filterType: 'residential', stories: 1 },
  { slug: 'two-story', label: '2 Story Homes', filterType: 'residential', stories: 2 },
  { slug: 'foreclosures', label: 'Foreclosures', filterType: 'residential', lastStatus: 'Lc' },
  { slug: 'one-acre-plus', label: '1+ Acre Properties', filterType: 'residential', minLotSize: 43560 },
  { slug: 'fha-approved', label: 'FHA Approved', filterType: 'condo', keywords: 'fha' },
  { slug: 'va-approved', label: 'VA Approved', filterType: 'residential', keywords: 'va approved' },
  { slug: 'pet-friendly-condos', label: 'Pet Friendly Condos', filterType: 'condo', keywords: 'pet' },
  { slug: 'rentals', label: 'Rentals', filterType: 'rental' },
  { slug: 'land', label: 'Lots & Land', filterType: 'land' },
]

export interface TemplateVariables {
  city: string
  county: string
  state: string
  stateCode: string
  subType: string
  subTypeSlug: string
  count: number
  year: number
}

/** Map a sub-type slug to its config */
export function getSubTypeBySlug(slug: string): SubTypeConfig | undefined {
  return subTypes.find((st) => st.slug === slug)
}

/** County slug helpers */
export function countyToSlug(county: string): string {
  return `${county.toLowerCase().replace(/\s+/g, '-')}-county`
}

export function slugToCounty(slug: string): string | undefined {
  const name = slug
    .replace(/-county$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return (targetCounties as readonly string[]).includes(name) ? name : undefined
}
