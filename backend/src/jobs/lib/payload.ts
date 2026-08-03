/**
 * Tolerant extractors for Repliers webhook payloads.
 *
 * Repliers event payload shapes are not exhaustively documented and can
 * nest the entity under a wrapper key (e.g. { listing: {...} } vs a flat
 * object), so every extractor probes the likely locations and returns
 * undefined rather than throwing. Update events carry a `previous` object
 * with the pre-update field values.
 */

export type WebhookPayload = Record<string, unknown>

function get(obj: unknown, key: string): unknown {
  if (obj && typeof obj === 'object' && key in (obj as object)) {
    return (obj as Record<string, unknown>)[key]
  }
  return undefined
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function pick(
  payload: WebhookPayload,
  wrappers: string[],
  key: string
): unknown {
  const direct = get(payload, key)
  if (direct !== undefined) return direct
  for (const wrapper of wrappers) {
    const nested = get(get(payload, wrapper), key)
    if (nested !== undefined) return nested
  }
  return undefined
}

const LISTING_WRAPPERS = ['listing', 'data']
const CLIENT_WRAPPERS = ['client', 'data']
const SEARCH_WRAPPERS = ['search', 'savedSearch', 'data']

export function mlsNumber(payload: WebhookPayload): string | undefined {
  return str(pick(payload, LISTING_WRAPPERS, 'mlsNumber'))
}

export function updatedOn(payload: WebhookPayload): string | undefined {
  return (
    str(pick(payload, LISTING_WRAPPERS, 'updatedOn')) ??
    str(pick(payload, LISTING_WRAPPERS, 'timestamp'))
  )
}

export function listPrice(payload: WebhookPayload): number | undefined {
  return num(pick(payload, LISTING_WRAPPERS, 'listPrice'))
}

export function listingStatus(payload: WebhookPayload): string | undefined {
  return (
    str(pick(payload, LISTING_WRAPPERS, 'lastStatus')) ??
    str(pick(payload, LISTING_WRAPPERS, 'status'))
  )
}

export interface ListingDetails {
  address?: string | undefined
  city?: string | undefined
  neighborhood?: string | undefined
  price?: number | undefined
  bedrooms?: number | undefined
  bathrooms?: number | undefined
  sqft?: number | undefined
  imageUrl?: string | undefined
  propertyType?: string | undefined
}

export function listingDetails(payload: WebhookPayload): ListingDetails {
  const address = pick(payload, LISTING_WRAPPERS, 'address')
  const details = pick(payload, LISTING_WRAPPERS, 'details')
  const images = pick(payload, LISTING_WRAPPERS, 'images')
  const firstImage = Array.isArray(images) ? str(images[0]) : undefined
  return {
    address: formatAddress(address),
    city: str(get(address, 'city')),
    neighborhood: str(get(address, 'neighborhood')),
    price: listPrice(payload),
    bedrooms: num(get(details, 'numBedrooms')),
    bathrooms: num(get(details, 'numBathrooms')),
    sqft: num(get(details, 'sqft')),
    imageUrl: firstImage
      ? firstImage.startsWith('http')
        ? firstImage
        : `https://cdn.repliers.io/${firstImage}`
      : undefined,
    propertyType: str(get(details, 'propertyType'))
  }
}

export function formatAddress(address: unknown): string | undefined {
  if (typeof address === 'string') return str(address)
  if (!address || typeof address !== 'object') return undefined
  const parts = [
    str(get(address, 'streetNumber')),
    str(get(address, 'streetName')),
    str(get(address, 'streetSuffix'))
  ]
    .filter(Boolean)
    .join(' ')
  const city = str(get(address, 'city'))
  const state = str(get(address, 'state'))
  const zip = str(get(address, 'zip'))
  const line = [parts, city, [state, zip].filter(Boolean).join(' ')]
    .filter((p) => p && p !== '')
    .join(', ')
  return str(line)
}

export function previous(payload: WebhookPayload): WebhookPayload | undefined {
  const prev = get(payload, 'previous')
  return prev && typeof prev === 'object' ? (prev as WebhookPayload) : undefined
}

export function clientId(payload: WebhookPayload): number | undefined {
  return num(pick(payload, CLIENT_WRAPPERS, 'clientId'))
}

export interface ClientDetails {
  clientId?: number | undefined
  firstName?: string | undefined
  lastName?: string | undefined
  email?: string | undefined
  phone?: string | undefined
}

export function clientDetails(payload: WebhookPayload): ClientDetails {
  return {
    clientId: clientId(payload),
    firstName:
      str(pick(payload, CLIENT_WRAPPERS, 'fname')) ??
      str(pick(payload, CLIENT_WRAPPERS, 'firstName')),
    lastName:
      str(pick(payload, CLIENT_WRAPPERS, 'lname')) ??
      str(pick(payload, CLIENT_WRAPPERS, 'lastName')),
    email: str(pick(payload, CLIENT_WRAPPERS, 'email'))?.toLowerCase(),
    phone: str(pick(payload, CLIENT_WRAPPERS, 'phone'))
  }
}

export function searchId(payload: WebhookPayload): number | undefined {
  return num(pick(payload, SEARCH_WRAPPERS, 'searchId'))
}

export interface SearchDetails {
  searchId?: number | undefined
  clientId?: number | undefined
  city?: string | undefined
  minPrice?: number | undefined
  maxPrice?: number | undefined
  minBedrooms?: number | undefined
}

export function searchDetails(payload: WebhookPayload): SearchDetails {
  const cities = pick(payload, SEARCH_WRAPPERS, 'city')
  return {
    searchId: searchId(payload),
    clientId: clientId(payload),
    city: Array.isArray(cities) ? str(cities[0]) : str(cities),
    minPrice: num(pick(payload, SEARCH_WRAPPERS, 'minPrice')),
    maxPrice: num(pick(payload, SEARCH_WRAPPERS, 'maxPrice')),
    minBedrooms:
      num(pick(payload, SEARCH_WRAPPERS, 'minBeds')) ??
      num(pick(payload, SEARCH_WRAPPERS, 'minBedrooms'))
  }
}

export function messageBody(payload: WebhookPayload): string | undefined {
  return (
    str(pick(payload, ['message', 'data'], 'content')) ??
    str(pick(payload, ['message', 'data'], 'body')) ??
    str(pick(payload, ['message', 'data'], 'message'))
  )
}
