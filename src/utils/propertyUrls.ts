/**
 * Property URL utilities
 *
 * Two URL schemes:
 * 1. Legacy /listing/[slug] — includes MLS number, changes per listing
 * 2. Permanent /homes/[slug] — address-only, never changes
 */

export interface PropertySlugParts {
  mlsNumber: string
  address?: string
}

// ─── Legacy /listing/ helpers ────────────────────────────────────

/**
 * Extract MLS number from property slug
 * @param slug - URL slug (e.g., "133-reagan-crest-dr-clayton-nc-27520-10134772")
 *               Can optionally include boardId at end (e.g., "...10134772-110")
 * @returns MLS number (e.g., "10134772")
 */
export function extractMlsFromSlug(slug: string): string {
  const segments = slug.split('-')
  const lastSegment = segments[segments.length - 1]

  // Check if last segment is a 1-3 digit boardId (e.g., "110")
  // If so, the MLS number is the second-to-last segment
  if (lastSegment && /^\d{1,3}$/.test(lastSegment)) {
    return segments[segments.length - 2] || lastSegment
  }

  return lastSegment
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
 * Generate a legacy /listing/ URL (kept for backward-compatibility)
 */
export function generateLegacyPropertyUrl(
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
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `/listing/${slug}`
}

// ─── Permanent /homes/ address-based URLs ────────────────────────

/**
 * Generate a permanent address-based URL (no MLS number).
 * The URL never changes regardless of listing status.
 */
export function generateStaticPropertyUrl(address: {
  streetNumber?: string
  streetName?: string
  streetSuffix?: string
  city?: string
  state?: string
  zip?: string
}): string {
  const street = [
    address.streetNumber,
    address.streetName,
    address.streetSuffix
  ]
    .filter(Boolean)
    .join('-')
  const parts = [street, address.city, address.state, address.zip].filter(
    Boolean
  )
  const slug = parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `/homes/${slug}`
}

/**
 * Parse an address slug back to display components.
 * Expects format: street-city-state(2char)-zip(5digit)
 */
export function parseAddressSlug(slug: string): {
  street: string
  city: string
  state: string
  zip: string
} | null {
  const match = slug.match(/^(.+)-([a-z-]+)-([a-z]{2})-(\d{5})$/)
  if (!match) return null
  return {
    street: match[1].replace(/-/g, ' '),
    city: match[2].replace(/-/g, ' '),
    state: match[3].toUpperCase(),
    zip: match[4]
  }
}

// ─── Primary URL generator (used site-wide) ──────────────────────

/**
 * Generate property URL — now points to permanent /homes/ address URL.
 * Every property link site-wide uses this.
 */
export function generatePropertyUrl(
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    streetNumber?: string
    streetName?: string
    streetSuffix?: string
  },
  mlsNumber?: string | number
): string {
  // If we have individual address components, use them for the permanent URL
  if (address.streetNumber || address.streetName) {
    return generateStaticPropertyUrl(address)
  }
  // Fallback: build from composite street field
  if (address.street) {
    const streetParts = address.street.trim().split(/\s+/)
    return generateStaticPropertyUrl({
      streetNumber: streetParts[0],
      streetName:
        streetParts.slice(1, -1).join(' ') || streetParts.slice(1).join(' '),
      streetSuffix:
        streetParts.length > 2
          ? streetParts[streetParts.length - 1]
          : undefined,
      city: address.city,
      state: address.state,
      zip: address.zip
    })
  }
  // Last resort: use MLS-based URL if no address available
  if (mlsNumber) {
    return `/listing/${mlsNumber}`
  }
  return '/homes'
}

/**
 * Generate direct property URL using only MLS number
 */
export function generateDirectPropertyUrl(mlsNumber: string | number): string {
  return `/listing/${mlsNumber}`
}
