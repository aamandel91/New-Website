import type { TemplateVariables } from '@configs/page-generation'

/**
 * Template processing engine for page generation.
 * Handles variable substitution, SEO meta generation, and slug parsing.
 */

/**
 * Replace {{variable}} placeholders in template content with values from variables.
 */
export function processTemplate(
  template: string,
  variables: Partial<TemplateVariables>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key as keyof TemplateVariables]
    return value !== undefined ? String(value) : match
  })
}

/**
 * Generate an SEO-optimized meta title.
 * Example: "45 Condos for Sale in Coral Springs, FL (2026)"
 */
export function generateMetaTitle(
  city: string,
  subType: string,
  count: number
): string {
  const year = new Date().getFullYear()
  return `${count} ${subType} for Sale in ${city}, FL (${year})`
}

/**
 * Generate an SEO-optimized meta description.
 * Example: "Browse 45 Condos for sale in Coral Springs, Broward County, FL..."
 */
export function generateMetaDescription(
  city: string,
  county: string,
  subType: string,
  count: number
): string {
  return (
    `Browse ${count} ${subType} for sale in ${city}, ${county} County, FL. ` +
    `View photos, prices, and property details. Updated daily on Florida Home Finder.`
  )
}

/**
 * Build a URL slug from an array of parts.
 * Lowercases, trims, replaces spaces with hyphens, and joins with '/'.
 */
export function generateSlug(parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part) =>
      part
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    )
    .join('/')
}

/** Page type determined from slug parsing */
export type FloridaPageType =
  | 'county'
  | 'city'
  | 'city-subtype'
  | 'city-schools'
  | 'city-zip'
  | 'city-neighborhood'

export interface ParsedSlug {
  pageType: FloridaPageType
  county: string
  city?: string
  subType?: string
  zip?: string
  neighborhood?: string
}

/**
 * Parse a catch-all slug array from /florida/[...slugs] back into structured params.
 *
 * Supported patterns:
 *   [broward-county]                                   → county page
 *   [broward-county, coral-springs]                    → city page
 *   [broward-county, coral-springs, condos]            → city + subtype
 *   [broward-county, coral-springs, schools]           → city + schools
 *   [broward-county, coral-springs, zip, 33071]        → city + zip
 *   [broward-county, coral-springs, neighborhoods, x]  → city + neighborhood
 */
export function parseSlug(slugs: string[]): ParsedSlug | null {
  if (!slugs || slugs.length === 0) return null

  const county = slugs[0]
  if (!county) return null

  // County-only page
  if (slugs.length === 1) {
    return { pageType: 'county', county }
  }

  const city = slugs[1]

  // City-only page
  if (slugs.length === 2) {
    return { pageType: 'city', county, city }
  }

  const segment3 = slugs[2]

  // Schools page
  if (segment3 === 'schools') {
    return { pageType: 'city-schools', county, city }
  }

  // Zip code page
  if (segment3 === 'zip' && slugs.length >= 4) {
    return { pageType: 'city-zip', county, city, zip: slugs[3] }
  }

  // Neighborhood page
  if (segment3 === 'neighborhoods' && slugs.length >= 4) {
    return { pageType: 'city-neighborhood', county, city, neighborhood: slugs[3] }
  }

  // Sub-type page (default for 3rd segment)
  return { pageType: 'city-subtype', county, city, subType: segment3 }
}

/**
 * Convert a slug segment back to a display name.
 * "coral-springs" → "Coral Springs"
 */
export function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert a display name to a slug segment.
 * "Coral Springs" → "coral-springs"
 */
export function displayNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Heading variation object for keyword-diverse SEO headings.
 */
export interface HeadingVariations {
  h1: string
  h2: string
  h3: string
  h4: string
}

/**
 * Generate varied heading text for use across a page.
 * Avoids repeating the same city+subtype phrase, boosting keyword coverage.
 */
export function generateHeadingVariations(
  city: string,
  county: string,
  state: string,
  subType: string,
  count?: number
): HeadingVariations {
  const stateCode = state === 'Florida' ? 'FL' : state
  const prefix = count !== undefined ? `${count} ` : ''
  return {
    h1: `${prefix}${subType} in ${city}, ${stateCode}`,
    h2: `${county} County ${subType} Market`,
    h3: `${city} Florida Real Estate — ${subType}`,
    h4: `Browse ${subType} for Sale in ${city}, ${stateCode}`,
  }
}
