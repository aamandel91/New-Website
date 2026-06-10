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

import { haversineMiles } from '@/utils/distance'

import type { ApiLastStatus } from 'services/API'

/**
 * Page generation configuration for Florida county/city/sub-type pages.
 * Defines target counties, property sub-types with search filters, and template variables.
 */

export interface CityEntry {
  name: string
  /** Centroid lat/lng. Omit when uncertain — city is then excluded from
   *  radius-based nearby lookups but still participates in page generation. */
  lat?: number
  lng?: number
}

export interface MarketConfig {
  id: string
  label: string
  counties: string[]
  primaryCity: string
  boardIds: number[]
  active: boolean
  citiesByCounty: Record<string, CityEntry[]>
}

export const markets: MarketConfig[] = [
  {
    id: 'south-florida',
    label: 'South Florida',
    counties: ['Miami-Dade', 'Broward', 'Palm Beach', 'Martin', 'St. Lucie'],
    primaryCity: 'Coral Springs',
    boardIds: [2],
    active: true,
    citiesByCounty: {
      'Miami-Dade': [
        { name: 'Miami', lat: 25.7617, lng: -80.1918 },
        { name: 'Miami Beach', lat: 25.7907, lng: -80.13 },
        { name: 'Coral Gables', lat: 25.7215, lng: -80.2684 },
        { name: 'Aventura', lat: 25.9565, lng: -80.1392 },
        { name: 'Sunny Isles Beach', lat: 25.9434, lng: -80.1228 },
        { name: 'Bal Harbour', lat: 25.8898, lng: -80.1267 },
        { name: 'Bay Harbor Islands', lat: 25.8881, lng: -80.1339 },
        { name: 'Surfside', lat: 25.8787, lng: -80.1259 },
        { name: 'Doral', lat: 25.8195, lng: -80.3553 },
        { name: 'Hialeah', lat: 25.8576, lng: -80.2781 },
        { name: 'Homestead', lat: 25.4687, lng: -80.4776 },
        { name: 'Kendall', lat: 25.6793, lng: -80.3173 },
        { name: 'Pinecrest', lat: 25.6648, lng: -80.3083 },
        { name: 'South Miami', lat: 25.7076, lng: -80.2934 },
        { name: 'Cutler Bay', lat: 25.5773, lng: -80.3469 },
        { name: 'Key Biscayne', lat: 25.6938, lng: -80.1626 },
        { name: 'Coconut Grove', lat: 25.7282, lng: -80.2434 },
        { name: 'Brickell', lat: 25.7605, lng: -80.1939 },
        { name: 'Wynwood', lat: 25.801, lng: -80.1995 },
        { name: 'Miami Lakes', lat: 25.9087, lng: -80.3084 },
        { name: 'North Miami Beach', lat: 25.9331, lng: -80.1625 },
        { name: 'Palmetto Bay', lat: 25.622, lng: -80.3242 }
      ],
      Broward: [
        { name: 'Fort Lauderdale', lat: 26.1224, lng: -80.1373 },
        { name: 'Coral Springs', lat: 26.271, lng: -80.2706 },
        { name: 'Pompano Beach', lat: 26.2378, lng: -80.1248 },
        { name: 'Deerfield Beach', lat: 26.3184, lng: -80.0998 },
        { name: 'Hollywood', lat: 26.0112, lng: -80.1495 },
        { name: 'Plantation', lat: 26.1275, lng: -80.2331 },
        { name: 'Davie', lat: 26.0628, lng: -80.2331 },
        { name: 'Weston', lat: 26.1003, lng: -80.3998 },
        { name: 'Coconut Creek', lat: 26.2515, lng: -80.1789 },
        { name: 'Parkland', lat: 26.3104, lng: -80.237 },
        { name: 'Sunrise', lat: 26.1339, lng: -80.267 },
        { name: 'Tamarac', lat: 26.2129, lng: -80.2497 },
        { name: 'Lighthouse Point', lat: 26.2756, lng: -80.0876 },
        { name: 'Hallandale Beach', lat: 25.9812, lng: -80.1484 },
        { name: 'Pembroke Pines', lat: 26.0034, lng: -80.2241 },
        { name: 'Miramar', lat: 25.9873, lng: -80.2323 },
        { name: 'Cooper City', lat: 26.0584, lng: -80.2717 },
        { name: 'Margate', lat: 26.2445, lng: -80.2064 },
        { name: 'Lauderdale by the Sea', lat: 26.1912, lng: -80.0951 }
      ],
      'Palm Beach': [
        { name: 'Boca Raton', lat: 26.3683, lng: -80.1289 },
        { name: 'West Palm Beach', lat: 26.7153, lng: -80.0534 },
        { name: 'Delray Beach', lat: 26.4615, lng: -80.0728 },
        { name: 'Boynton Beach', lat: 26.5318, lng: -80.0905 },
        { name: 'Palm Beach Gardens', lat: 26.8234, lng: -80.1387 },
        { name: 'Jupiter', lat: 26.9342, lng: -80.0942 },
        { name: 'Wellington', lat: 26.6618, lng: -80.2414 },
        { name: 'Lake Worth', lat: 26.6151, lng: -80.0573 },
        { name: 'Greenacres', lat: 26.6276, lng: -80.1256 },
        { name: 'Royal Palm Beach', lat: 26.7087, lng: -80.2306 },
        { name: 'Palm Beach', lat: 26.7056, lng: -80.0364 },
        { name: 'Juno Beach', lat: 26.8784, lng: -80.0534 },
        { name: 'Tequesta', lat: 26.9659, lng: -80.1253 },
        { name: 'Loxahatchee', lat: 26.684, lng: -80.2625 }
      ],
      Martin: [
        { name: 'Stuart', lat: 27.1973, lng: -80.2528 },
        { name: 'Palm City', lat: 27.1689, lng: -80.2664 },
        { name: 'Hobe Sound', lat: 27.0639, lng: -80.1378 },
        { name: 'Jensen Beach', lat: 27.2478, lng: -80.2289 },
        { name: 'Indiantown', lat: 27.0275, lng: -80.4878 },
        { name: 'Port Salerno', lat: 27.1456, lng: -80.2003 },
        { name: 'Rio', lat: 27.2117, lng: -80.2275 },
        { name: 'Sewalls Point', lat: 27.1951, lng: -80.2017 }
      ],
      'St. Lucie': [
        { name: 'Port St. Lucie', lat: 27.2939, lng: -80.3503 },
        { name: 'Fort Pierce', lat: 27.4467, lng: -80.3256 },
        { name: 'Tradition', lat: 27.2725, lng: -80.4147 },
        { name: 'St. Lucie West', lat: 27.3097, lng: -80.4042 },
        { name: 'Hutchinson Island', lat: 27.3203, lng: -80.2378 },
        { name: 'White City', lat: 27.3878, lng: -80.3544 },
        { name: 'Lakewood Park', lat: 27.5267, lng: -80.3914 }
      ]
    }
  },
  {
    id: 'naples-swfl',
    label: 'Naples / SW Florida',
    counties: ['Collier', 'Lee', 'Charlotte'],
    primaryCity: 'Naples',
    boardIds: [],
    active: false,
    citiesByCounty: {
      Collier: [
        { name: 'Naples', lat: 26.142, lng: -81.7948 },
        { name: 'Marco Island', lat: 25.9412, lng: -81.7184 },
        { name: 'Bonita Springs', lat: 26.3398, lng: -81.7787 },
        { name: 'Estero', lat: 26.4382, lng: -81.8068 },
        { name: 'Pelican Bay', lat: 26.2362, lng: -81.8128 },
        { name: 'Vanderbilt Beach', lat: 26.2509, lng: -81.8228 },
        // North Naples, East Naples, Lely Resort: unincorporated areas without
        // a clearly authoritative centroid — left without coords. Inactive market.
        { name: 'North Naples' },
        { name: 'East Naples' },
        { name: 'Lely Resort' },
        { name: 'Golden Gate', lat: 26.1875, lng: -81.6953 },
        { name: 'Ave Maria', lat: 26.3409, lng: -81.4259 }
      ],
      Lee: [
        { name: 'Fort Myers', lat: 26.6406, lng: -81.8723 },
        { name: 'Cape Coral', lat: 26.5629, lng: -81.9495 },
        { name: 'Sanibel', lat: 26.4481, lng: -82.012 },
        // Miromar Lakes: small CDP, coords uncertain
        { name: 'Miromar Lakes' }
      ],
      Charlotte: [
        { name: 'Port Charlotte', lat: 26.9762, lng: -82.0907 },
        { name: 'Punta Gorda', lat: 26.9298, lng: -82.0454 }
      ]
    }
  },
  {
    id: 'tampa-bay',
    label: 'Tampa Bay',
    counties: ['Hillsborough', 'Pinellas', 'Pasco', 'Manatee'],
    primaryCity: 'Tampa',
    boardIds: [],
    active: false,
    citiesByCounty: {
      Hillsborough: [
        { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
        { name: 'Brandon', lat: 27.9378, lng: -82.2859 },
        { name: 'Riverview', lat: 27.8661, lng: -82.3265 },
        { name: 'Plant City', lat: 28.0186, lng: -82.1148 },
        { name: 'Lutz', lat: 28.1508, lng: -82.4617 },
        // South Tampa, Davis Islands, Harbour Island, Beach Park, Hyde Park,
        // Seminole Heights are Tampa neighborhoods — left without coords for
        // safety; not authoritative cities.
        { name: 'South Tampa' },
        { name: 'Davis Islands' },
        { name: 'Harbour Island' },
        { name: 'Beach Park' },
        { name: 'Hyde Park' },
        { name: 'Westchase', lat: 28.0589, lng: -82.6181 },
        { name: 'Carrollwood', lat: 28.0509, lng: -82.5089 },
        { name: 'Seminole Heights' }
      ],
      Pinellas: [
        { name: 'St. Petersburg', lat: 27.7676, lng: -82.6403 },
        { name: 'Clearwater', lat: 27.9659, lng: -82.8001 },
        { name: 'Palm Harbor', lat: 28.0781, lng: -82.7637 },
        { name: 'Dunedin', lat: 28.0199, lng: -82.7717 },
        { name: 'Safety Harbor', lat: 28.0014, lng: -82.6929 },
        { name: 'Tarpon Springs', lat: 28.1461, lng: -82.757 }
      ],
      Pasco: [
        { name: 'Wesley Chapel', lat: 28.2391, lng: -82.3268 },
        { name: 'Odessa', lat: 28.1808, lng: -82.5895 },
        { name: 'Land O Lakes', lat: 28.2197, lng: -82.4617 },
        { name: 'New Port Richey', lat: 28.2442, lng: -82.7193 }
      ],
      // Lakeland is actually Polk County; assumed Manatee here for a rough grouping
      // since the original flat list included it under tampa-bay. Sarasota is in
      // its own market, so kept under Manatee here loosely as an inactive-market
      // best-guess until tampa-bay is activated.
      Manatee: [
        { name: 'Bradenton', lat: 27.4989, lng: -82.5748 },
        { name: 'Sarasota', lat: 27.3364, lng: -82.5307 },
        { name: 'Lakeland', lat: 28.0395, lng: -81.9498 }
      ]
    }
  },
  {
    id: 'orlando',
    label: 'Orlando Metro',
    counties: ['Orange', 'Seminole', 'Osceola', 'Lake'],
    primaryCity: 'Orlando',
    boardIds: [],
    active: false,
    citiesByCounty: {
      Orange: [
        { name: 'Orlando', lat: 28.5383, lng: -81.3792 },
        { name: 'Winter Park', lat: 28.5999, lng: -81.3392 },
        { name: 'Windermere', lat: 28.4953, lng: -81.535 },
        // Dr. Phillips, Lake Nona: neighborhoods/CDPs — left uncoded
        { name: 'Dr. Phillips' },
        { name: 'Lake Nona' },
        { name: 'Maitland', lat: 28.6278, lng: -81.3631 },
        { name: 'Apopka', lat: 28.6934, lng: -81.5322 },
        { name: 'Ocoee', lat: 28.5694, lng: -81.544 }
      ],
      Seminole: [
        { name: 'Altamonte Springs', lat: 28.6611, lng: -81.3656 },
        { name: 'Longwood', lat: 28.7031, lng: -81.3384 },
        { name: 'Winter Springs', lat: 28.6986, lng: -81.2731 },
        { name: 'Sanford', lat: 28.8005, lng: -81.2731 },
        { name: 'Casselberry', lat: 28.6778, lng: -81.3281 },
        { name: 'Oviedo', lat: 28.67, lng: -81.2081 },
        { name: 'Lake Mary', lat: 28.7589, lng: -81.3178 },
        // Heathrow: CDP, coords uncertain
        { name: 'Heathrow' }
      ],
      Osceola: [
        { name: 'Kissimmee', lat: 28.292, lng: -81.4076 },
        { name: 'Celebration', lat: 28.3247, lng: -81.5364 }
      ],
      Lake: [
        { name: 'Clermont', lat: 28.5494, lng: -81.7729 },
        { name: 'Davenport', lat: 28.1611, lng: -81.602 }
      ]
    }
  },
  {
    id: 'sarasota',
    label: 'Sarasota',
    counties: ['Sarasota'],
    primaryCity: 'Sarasota',
    boardIds: [],
    active: false,
    citiesByCounty: {
      Sarasota: [
        { name: 'Sarasota', lat: 27.3364, lng: -82.5307 },
        { name: 'Venice', lat: 27.0998, lng: -82.4543 },
        { name: 'Nokomis', lat: 27.1198, lng: -82.444 },
        { name: 'Osprey', lat: 27.1953, lng: -82.4904 },
        { name: 'North Port', lat: 27.044, lng: -82.2359 },
        { name: 'Englewood', lat: 26.962, lng: -82.3526 },
        { name: 'Longboat Key', lat: 27.3984, lng: -82.6448 },
        { name: 'Siesta Key', lat: 27.2659, lng: -82.5462 },
        // Casey Key, Palmer Ranch, The Meadows, Bird Key, Lido Key, Gulf Gate
        // Estates: small islands/CDPs/neighborhoods — left uncoded for safety
        { name: 'Casey Key' },
        { name: 'Palmer Ranch' },
        { name: 'The Meadows' },
        { name: 'Lakewood Ranch', lat: 27.4187, lng: -82.4129 },
        { name: 'Bird Key' },
        { name: 'Lido Key' },
        { name: 'Gulf Gate Estates' }
      ]
    }
  }
]

// Derived exports - update automatically when markets are activated
export const activeMarkets = markets.filter((m) => m.active)
export const targetCounties = activeMarkets.flatMap(
  (m) => m.counties
) as readonly string[]
export type TargetCounty = string
export const allActiveBoardIds = [
  ...new Set(activeMarkets.flatMap((m) => m.boardIds))
]
export const primaryCity = activeMarkets[0]?.primaryCity ?? 'Coral Springs'

// nearbyCities lookup keyed by county - kept for backward compat with any
// callers still grouping by county. Values are city names only.
export const nearbyCitiesByCounty: Record<string, string[]> = {}
for (const market of activeMarkets) {
  for (const county of market.counties) {
    nearbyCitiesByCounty[county] = (market.citiesByCounty[county] ?? []).map(
      (c) => c.name
    )
  }
}

// Reverse lookup: city name (lowercased) → county. Built from active markets.
export const cityToCounty: Record<string, string> = {}
for (const market of activeMarkets) {
  for (const [county, cities] of Object.entries(market.citiesByCounty)) {
    for (const city of cities) {
      cityToCounty[city.name.toLowerCase()] = county
    }
  }
}

export function findCountyForCity(cityName: string): string | undefined {
  return cityToCounty[cityName.toLowerCase()]
}

interface CityCoord {
  name: string
  lat: number
  lng: number
}

// Flat list of all active-market cities that have lat/lng. Cities without
// coordinates are excluded from radius queries but still exist in the
// markets config for page generation.
export const allActiveCities: CityCoord[] = []
for (const market of activeMarkets) {
  for (const cities of Object.values(market.citiesByCounty)) {
    for (const city of cities) {
      if (typeof city.lat === 'number' && typeof city.lng === 'number') {
        allActiveCities.push({ name: city.name, lat: city.lat, lng: city.lng })
      }
    }
  }
}

/**
 * Find cities within a radius of the given city by great-circle distance.
 * Expands the radius automatically (20 → 30 → 40 → 50 miles) until at least
 * `minResults` cities are found OR the max radius is reached. Returns up to
 * `maxResults` cities sorted by distance ascending. Returns [] when the input
 * city isn't found in `allActiveCities` (caller should fall back).
 */
export function findNearbyCities(
  cityName: string,
  options: { minResults?: number; maxResults?: number } = {}
): string[] {
  const { minResults = 12, maxResults = 12 } = options
  const cityLower = cityName.toLowerCase()
  const center = allActiveCities.find((c) => c.name.toLowerCase() === cityLower)
  if (!center) return []

  const radii = [20, 30, 40, 50]
  let lastMatches: string[] = []
  for (let i = 0; i < radii.length; i += 1) {
    const radius = radii[i]
    const matches = allActiveCities
      .filter((c) => c.name.toLowerCase() !== cityLower)
      .map((c) => ({
        name: c.name,
        distance: haversineMiles(center.lat, center.lng, c.lat, c.lng)
      }))
      .filter((m) => m.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)
      .map((m) => m.name)

    lastMatches = matches
    if (matches.length >= minResults || i === radii.length - 1) {
      return matches
    }
  }
  return lastMatches
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
  {
    slug: 'single-family-homes',
    label: 'Single Family Homes',
    filterType: 'residential',
    propertyType: 'Detached'
  },
  {
    slug: 'condos',
    label: 'Condos',
    filterType: 'condo',
    propertyType: 'Apartment'
  },
  {
    slug: 'townhomes',
    label: 'Townhomes',
    filterType: 'residential',
    propertyType: 'Att/Row/Twnhouse'
  },
  {
    slug: 'multi-family',
    label: 'Multi-Family Homes',
    filterType: 'residential',
    propertyType: 'Multi-Family'
  },
  {
    slug: 'luxury',
    label: 'Luxury Homes',
    filterType: 'residential',
    minPrice: 1000000
  },
  {
    slug: 'waterfront',
    label: 'Waterfront Homes',
    filterType: 'residential',
    keywords: 'waterfront'
  },
  {
    slug: 'pool-homes',
    label: 'Pool Homes',
    filterType: 'residential',
    keywords: 'pool'
  },
  {
    slug: 'new-construction',
    label: 'New Construction',
    filterType: 'residential',
    keywords: 'new construction'
  },
  {
    slug: '55-plus',
    label: '55+ Communities',
    filterType: 'residential',
    keywords: '55+'
  },
  {
    slug: 'gated-communities',
    label: 'Gated Communities',
    filterType: 'residential',
    keywords: 'gated'
  },
  {
    slug: 'no-hoa',
    label: 'No HOA Homes',
    filterType: 'residential',
    keywords: 'no hoa'
  },
  {
    slug: 'ocean-access',
    label: 'Ocean Access Homes',
    filterType: 'residential',
    keywords: 'ocean access'
  },
  {
    slug: 'country-club',
    label: 'Country Club Homes',
    filterType: 'residential',
    keywords: 'country club'
  },
  {
    slug: 'one-story',
    label: '1 Story Homes',
    filterType: 'residential',
    stories: 1
  },
  {
    slug: 'two-story',
    label: '2 Story Homes',
    filterType: 'residential',
    stories: 2
  },
  {
    slug: 'foreclosures',
    label: 'Foreclosures',
    filterType: 'residential',
    lastStatus: 'Lc'
  },
  {
    slug: 'one-acre-plus',
    label: '1+ Acre Properties',
    filterType: 'residential',
    minLotSize: 43560
  },
  {
    slug: 'fha-approved',
    label: 'FHA Approved',
    filterType: 'condo',
    keywords: 'fha'
  },
  {
    slug: 'va-approved',
    label: 'VA Approved',
    filterType: 'residential',
    keywords: 'va approved'
  },
  {
    slug: 'pet-friendly-condos',
    label: 'Pet Friendly Condos',
    filterType: 'condo',
    keywords: 'pet'
  },
  { slug: 'rentals', label: 'Rentals', filterType: 'rental' },
  { slug: 'land', label: 'Lots & Land', filterType: 'land' }
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
