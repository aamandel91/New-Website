/**
 * BACKEND MARKET CONFIG — mirrors active markets from
 * src/configs/defaults/page-generation.ts (frontend).
 *
 * Mirrored here because the backend can't import from the Next.js source tree
 * (separate tsconfig, separate build), matching the pattern used by
 * backend/src/config/tenant.config.ts. Only the *active* market entries are
 * mirrored — inactive markets (Naples, Tampa, Orlando, etc.) are intentionally
 * omitted so that AI-suggested tags can never name a county/city we don't yet
 * serve.
 *
 * To add or remove a market here, do it in lockstep with page-generation.ts
 * `markets[].active`.
 */

export interface CityEntry {
  name: string
  county: string
}

/** Active counties (Florida only, as of 2026-05). */
export const activeCounties: string[] = [
  'Miami-Dade',
  'Broward',
  'Palm Beach',
  'Martin',
  'St. Lucie'
]

/** Active cities, flat list keyed by county. Names match page-generation.ts. */
export const activeCities: CityEntry[] = [
  // Miami-Dade
  { name: 'Miami', county: 'Miami-Dade' },
  { name: 'Miami Beach', county: 'Miami-Dade' },
  { name: 'Coral Gables', county: 'Miami-Dade' },
  { name: 'Aventura', county: 'Miami-Dade' },
  { name: 'Sunny Isles Beach', county: 'Miami-Dade' },
  { name: 'Bal Harbour', county: 'Miami-Dade' },
  { name: 'Bay Harbor Islands', county: 'Miami-Dade' },
  { name: 'Surfside', county: 'Miami-Dade' },
  { name: 'Doral', county: 'Miami-Dade' },
  { name: 'Hialeah', county: 'Miami-Dade' },
  { name: 'Homestead', county: 'Miami-Dade' },
  { name: 'Kendall', county: 'Miami-Dade' },
  { name: 'Pinecrest', county: 'Miami-Dade' },
  { name: 'South Miami', county: 'Miami-Dade' },
  { name: 'Cutler Bay', county: 'Miami-Dade' },
  { name: 'Key Biscayne', county: 'Miami-Dade' },
  { name: 'Coconut Grove', county: 'Miami-Dade' },
  { name: 'Brickell', county: 'Miami-Dade' },
  { name: 'Wynwood', county: 'Miami-Dade' },
  { name: 'Miami Lakes', county: 'Miami-Dade' },
  { name: 'North Miami Beach', county: 'Miami-Dade' },
  { name: 'Palmetto Bay', county: 'Miami-Dade' },
  // Broward
  { name: 'Fort Lauderdale', county: 'Broward' },
  { name: 'Coral Springs', county: 'Broward' },
  { name: 'Pompano Beach', county: 'Broward' },
  { name: 'Deerfield Beach', county: 'Broward' },
  { name: 'Hollywood', county: 'Broward' },
  { name: 'Plantation', county: 'Broward' },
  { name: 'Davie', county: 'Broward' },
  { name: 'Weston', county: 'Broward' },
  { name: 'Coconut Creek', county: 'Broward' },
  { name: 'Parkland', county: 'Broward' },
  { name: 'Sunrise', county: 'Broward' },
  { name: 'Tamarac', county: 'Broward' },
  { name: 'Lighthouse Point', county: 'Broward' },
  { name: 'Hallandale Beach', county: 'Broward' },
  { name: 'Pembroke Pines', county: 'Broward' },
  { name: 'Miramar', county: 'Broward' },
  { name: 'Cooper City', county: 'Broward' },
  { name: 'Margate', county: 'Broward' },
  { name: 'Lauderdale by the Sea', county: 'Broward' },
  // Palm Beach
  { name: 'Boca Raton', county: 'Palm Beach' },
  { name: 'West Palm Beach', county: 'Palm Beach' },
  { name: 'Delray Beach', county: 'Palm Beach' },
  { name: 'Boynton Beach', county: 'Palm Beach' },
  { name: 'Palm Beach Gardens', county: 'Palm Beach' },
  { name: 'Jupiter', county: 'Palm Beach' },
  { name: 'Wellington', county: 'Palm Beach' },
  { name: 'Lake Worth', county: 'Palm Beach' },
  { name: 'Greenacres', county: 'Palm Beach' },
  { name: 'Royal Palm Beach', county: 'Palm Beach' },
  { name: 'Palm Beach', county: 'Palm Beach' },
  { name: 'Juno Beach', county: 'Palm Beach' },
  { name: 'Tequesta', county: 'Palm Beach' },
  { name: 'Loxahatchee', county: 'Palm Beach' },
  // Martin
  { name: 'Stuart', county: 'Martin' },
  { name: 'Palm City', county: 'Martin' },
  { name: 'Hobe Sound', county: 'Martin' },
  { name: 'Jensen Beach', county: 'Martin' },
  { name: 'Indiantown', county: 'Martin' },
  { name: 'Port Salerno', county: 'Martin' },
  { name: 'Rio', county: 'Martin' },
  { name: 'Sewalls Point', county: 'Martin' },
  // St. Lucie
  { name: 'Port St. Lucie', county: 'St. Lucie' },
  { name: 'Fort Pierce', county: 'St. Lucie' },
  { name: 'Tradition', county: 'St. Lucie' },
  { name: 'St. Lucie West', county: 'St. Lucie' },
  { name: 'Hutchinson Island', county: 'St. Lucie' },
  { name: 'White City', county: 'St. Lucie' },
  { name: 'Lakewood Park', county: 'St. Lucie' }
]

/**
 * Curated neighborhoods (sub-city locales). Empty for now — the frontend
 * page-generation system does not yet enumerate neighborhoods. Some city
 * entries like 'Brickell', 'Wynwood', 'Coconut Grove' are technically Miami
 * neighborhoods but live in activeCities for SEO page-generation reasons; we
 * don't double-count them here.
 */
export const activeNeighborhoods: string[] = []

/** Lowercased URL-safe slug. Mirrors slugify in RelatedBlogPostsService. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
