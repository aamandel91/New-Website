import crypto from 'node:crypto'
import { tenant, tenantKey } from '../../config/tenant.config.js'

/** Active tenant key ('floridahomefinder' | 'countryclub') for table rows. */
export const TENANT = tenantKey

/** e.g. "Florida Home Finder Portal" — used as the SureSend person source. */
export const PORTAL_SOURCE = `${tenant.brand.siteName} Portal`

/** Listing URL on this tenant's own domain. */
export function listingUrl(mlsNumber: string): string {
  return `${tenant.brand.siteUrl}/listing/${encodeURIComponent(mlsNumber)}`
}

export function searchUrl(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return `${tenant.brand.siteUrl}/search/map${qs ? `?${qs}` : ''}`
}

/** Price band tag from a listing/search price. */
export function priceBandTag(price: number | undefined | null): string | null {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return null
  }
  if (price < 500_000) return 'band-under-500k'
  if (price <= 1_000_000) return 'band-500k-1m'
  return 'band-1m-plus'
}

export function communityTag(name: string | undefined | null): string | null {
  const slug = slugify(name)
  return slug ? `community-${slug}` : null
}

export function slugify(value: string | undefined | null): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatPrice(price: number | undefined | null): string {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 'n/a'
  return `$${Math.round(price).toLocaleString('en-US')}`
}

/** Stable fallback dedupe key when a payload has no natural ID. */
export function payloadHash(payload: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload ?? {}))
    .digest('hex')
    .slice(0, 40)
}
