/**
 * ADDING A NEW MARKET - complete checklist:
 *
 * 1. Set active: true on the market in the markets array below
 * 2. Add the correct boardIds from Repliers for that market's MLS boards
 *    (contact Repliers support - they provide board IDs per MLS feed)
 * 3. Verify the Repliers API key has access to the new board IDs
 * 4. Add the new market's cities to the header nav in:
 *    src/components/templates/components/Header/navData.ts
 * 5. Update site-settings.ts metaTitle and metaDescription if this is
 *    a major market addition
 * 6. Update organizationSchema areaServed in src/utils/structuredData.ts
 * 7. Run the page generator admin for the new market's counties
 * 8. Submit updated sitemap to Google Search Console
 *
 * Everything else updates automatically:
 * - Sitemap generation
 * - Page scoring and noindex logic
 * - AI content market context
 * - Nearby cities internal linking
 * - Nav property type links
 * - Footer links
 * - PPC feed target areas
 * - Homepage tile activation
 * - Area scores dashboard
 * - Backfill API default county
 *
 * PPC minimum price is $750,000. Do not lower this for any market.
 */

import type { ApiLastStatus } from 'services/API'

/**
 * Page generation configuration for Florida county/city/sub-type pages.
 * Defines target counties, property sub-types with search filters, and template variables.
 */

export interface MarketConfig {
  id: string
  label: string
  counties: string[]
  primaryCity: string
  boardIds: number[]
  active: boolean
  nearbyCities: string[]
}

export const markets: MarketConfig[] = [
  {
    id: 'south-florida',
    label: 'South Florida',
    counties: ['Miami-Dade', 'Broward', 'Palm Beach', 'Martin', 'St. Lucie'],
    primaryCity: 'Coral Springs',
    boardIds: [2],
    active: true,
    nearbyCities: [
      // Miami-Dade
      'Miami', 'Miami Beach', 'Coral Gables', 'Aventura', 'Sunny Isles Beach',
      'Bal Harbour', 'Bay Harbor Islands', 'Surfside', 'Doral', 'Hialeah',
      'Homestead', 'Kendall', 'Pinecrest', 'South Miami', 'Cutler Bay',
      'Key Biscayne', 'Coconut Grove', 'Brickell', 'Wynwood', 'Miami Lakes',
      'North Miami Beach', 'Palmetto Bay',
      // Broward
      'Fort Lauderdale', 'Coral Springs', 'Pompano Beach', 'Deerfield Beach',
      'Boca Raton', 'Hollywood', 'Plantation', 'Davie', 'Weston', 'Coconut Creek',
      'Parkland', 'Sunrise', 'Tamarac', 'Lighthouse Point', 'Hallandale Beach',
      'Pembroke Pines', 'Miramar', 'Cooper City', 'Margate', 'Lauderdale by the Sea',
      // Palm Beach
      'West Palm Beach', 'Boca Raton', 'Delray Beach', 'Boynton Beach',
      'Palm Beach Gardens', 'Jupiter', 'Wellington', 'Lake Worth', 'Greenacres',
      'Royal Palm Beach', 'Palm Beach', 'Juno Beach', 'Tequesta', 'Loxahatchee',
      // Martin
      'Stuart', 'Palm City', 'Hobe Sound', 'Jensen Beach', 'Indiantown',
      'Port Salerno', 'Rio', 'Sewalls Point',
      // St. Lucie
      'Port St. Lucie', 'Fort Pierce', 'Tradition', 'St. Lucie West',
      'Hutchinson Island', 'White City', 'Lakewood Park'
    ]
  },
  {
    id: 'naples-swfl',
    label: 'Naples / SW Florida',
    counties: ['Collier', 'Lee', 'Charlotte'],
    primaryCity: 'Naples',
    boardIds: [],
    active: false,
    nearbyCities: [
      'Naples', 'Marco Island', 'Bonita Springs', 'Estero', 'Fort Myers',
      'Cape Coral', 'Sanibel', 'Port Charlotte', 'Punta Gorda', 'Ave Maria',
      'Golden Gate', 'Pelican Bay', 'Vanderbilt Beach', 'North Naples',
      'East Naples', 'Lely Resort', 'Miromar Lakes'
    ]
  },
  {
    id: 'tampa-bay',
    label: 'Tampa Bay',
    counties: ['Hillsborough', 'Pinellas', 'Pasco', 'Manatee'],
    primaryCity: 'Tampa',
    boardIds: [],
    active: false,
    nearbyCities: [
      'Tampa', 'St. Petersburg', 'Clearwater', 'Brandon', 'Wesley Chapel',
      'Riverview', 'Sarasota', 'Bradenton', 'Lakeland', 'Plant City',
      'Palm Harbor', 'Dunedin', 'Safety Harbor', 'Odessa', 'Lutz',
      'Land O Lakes', 'New Port Richey', 'Tarpon Springs', 'South Tampa',
      'Davis Islands', 'Harbour Island', 'Beach Park', 'Hyde Park',
      'Westchase', 'Carrollwood', 'Seminole Heights'
    ]
  },
  {
    id: 'orlando',
    label: 'Orlando Metro',
    counties: ['Orange', 'Seminole', 'Osceola', 'Lake'],
    primaryCity: 'Orlando',
    boardIds: [],
    active: false,
    nearbyCities: [
      'Orlando', 'Winter Park', 'Windermere', 'Dr. Phillips', 'Lake Nona',
      'Celebration', 'Kissimmee', 'Ocoee', 'Apopka', 'Altamonte Springs',
      'Longwood', 'Winter Springs', 'Sanford', 'Clermont', 'Davenport',
      'Maitland', 'Casselberry', 'Oviedo', 'Heathrow', 'Lake Mary'
    ]
  },
  {
    id: 'sarasota',
    label: 'Sarasota',
    counties: ['Sarasota'],
    primaryCity: 'Sarasota',
    boardIds: [],
    active: false,
    nearbyCities: [
      'Sarasota', 'Venice', 'Nokomis', 'Osprey', 'North Port',
      'Englewood', 'Longboat Key', 'Siesta Key', 'Casey Key',
      'Palmer Ranch', 'The Meadows', 'Lakewood Ranch', 'Bird Key',
      'Lido Key', 'Gulf Gate Estates'
    ]
  }
]

// Derived exports - update automatically when markets are activated
export const activeMarkets = markets.filter(m => m.active)
export const targetCounties = activeMarkets.flatMap(m => m.counties) as readonly string[]
export type TargetCounty = string
export const allActiveBoardIds = [...new Set(activeMarkets.flatMap(m => m.boardIds))]
export const primaryCity = activeMarkets[0]?.primaryCity ?? 'Coral Springs'

// nearbyCities lookup keyed by county - used for internal linking on city pages
export const nearbyCitiesByCounty: Record<string, string[]> = {}
for (const market of activeMarkets) {
  for (const county of market.counties) {
    nearbyCitiesByCounty[county] = market.nearbyCities
  }
}

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
  return `${county.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-')}-county`
}

export function slugToCounty(slug: string): string | undefined {
  return targetCounties.find((c) => countyToSlug(c) === slug)
}
