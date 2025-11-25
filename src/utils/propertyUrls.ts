/**
 * Property URL utilities for /homedetails/[slug] routing
 * Slug format: street-city-state-zip-mlsNumber
 * Example: 133-reagan-crest-dr-clayton-nc-27520-10134772
 */

export interface PropertySlugParts {
  mlsNumber: string
  address?: string
}

/**
 * Extract MLS number from property slug
 * @param slug - URL slug (e.g., "133-reagan-crest-dr-clayton-nc-27520-10134772")
 * @returns MLS number (e.g., "10134772")
 */
export function extractMlsFromSlug(slug: string): string {
  const segments = slug.split('-')
  return segments[segments.length - 1]
}

/**
 * Parse property slug into its components
 * @param slug - URL slug
 * @returns Object with mlsNumber and address
 */
export function parsePropertySlug(slug: string): PropertySlugParts {
  const mlsNumber = extractMlsFromSlug(slug)
  const addressParts = slug.replace(`-${mlsNumber}`, '')

  return {
    mlsNumber,
    address: addressParts.replace(/-/g, ' ')
  }
}

/**
 * Generate property detail URL from address and MLS number
 * @param address - Property address object
 * @param mlsNumber - MLS listing number
 * @returns URL path (e.g., "/homedetails/133-reagan-crest-dr-clayton-nc-27520-10134772")
 */
export function generatePropertyUrl(
  address: { street?: string; city?: string; state?: string; zip?: string },
  mlsNumber: string | number
): string {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    mlsNumber.toString()
  ].filter(Boolean)

  const slug = parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  return `/homedetails/${slug}`
}

/**
 * Generate direct property URL using only MLS number
 * @param mlsNumber - MLS listing number
 * @returns URL path (e.g., "/homedetails/10134772")
 */
export function generateDirectPropertyUrl(mlsNumber: string | number): string {
  return `/homedetails/${mlsNumber}`
}
