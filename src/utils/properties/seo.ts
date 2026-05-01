import searchConfig from '@configs/search'

import { type Property } from 'services/API'
import { generatePropertyUrl } from 'utils/propertyUrls'
import {
  capitalize,
  joinNonEmpty,
} from 'utils/strings'

import { formatShortAddress } from './formatters'
import { sanitizeScrubbed } from './sanitizers'
import {
  rent,
  sold
} from '.'

/**
 * @description Generates the canonical URL for a property.
 * Emits the permanent address-based `/homes/[slug]` URL whenever address
 * fields are present; falls back to the legacy `/listing/<mls>` form only
 * as a last resort when no address is available. `startImage` is preserved
 * as a query string; `boardId` is no longer encoded in the path because the
 * permanent URL is address-only.
 */
export const getSeoUrl = (
  property: Partial<Property>,
  options?: {
    startImage?: number
    boardId?: number
  }
): string => {
  const { address = {}, mlsNumber = '' } = property
  const startImage = options?.startImage || property.startImage

  // Strip the "!scrubbed!" placeholder from address fields before building
  // the URL so scrubbed listings don't leak the placeholder into the slug.
  const scrub = (v?: string) => {
    const cleaned = sanitizeScrubbed(v || '').trim()
    return cleaned || undefined
  }
  const cleanedAddress = {
    streetNumber: scrub((address as Property['address']).streetNumber),
    streetName: scrub((address as Property['address']).streetName),
    streetSuffix: scrub((address as Property['address']).streetSuffix),
    city: scrub((address as Property['address']).city),
    state: scrub((address as Property['address']).state),
    zip: scrub((address as Property['address']).zip),
  }

  const baseUrl = generatePropertyUrl(cleanedAddress, mlsNumber)
  const queryString = startImage ? `?startImage=${startImage}` : ''

  return `${baseUrl}${queryString}`
}

// TODO: remove hardcoded strings and map propertyType to constants
export const getSeoType = (type: string): string =>
  type
    .replace('Family For Sale', 'Family House For Sale')
    .replace('Detached', 'Detached House')
    .replace('Residential', 'House')
    .replace('Lots and Land', 'Land')
    .replace('Condo/Co-Op', 'Condo')

// TODO: remove hardcoded strings and map propertyType to constants
export const getSeoStatus = (property: Property): string =>
  sold(property) ? 'Sold' : rent(property) ? 'For Rent' : 'For Sale'

export const getSeoTitle = (property: Property): string => {
  const { address, mlsNumber } = property

  const localAddress = formatShortAddress(address, true)
  const { city, state, zip } = address

  const fullAddress = joinNonEmpty(
    [
      localAddress,
      capitalize(city?.toLowerCase()),
      joinNonEmpty([capitalize(state), zip ? String(zip).toUpperCase() : ''], ' ')
    ],
    ', '
  )

  const parts = [fullAddress]
  if (mlsNumber) parts.push(`MLS# ${mlsNumber}`)
  parts.push('Florida Home Finder')

  return parts.join(' | ')
}

const { defaultBoardId } = searchConfig

export const parseSeoUrl = (url: string) => {
  const slugs = url.split('-')

  const boardId = Number(
    (slugs.at(-1) || '').match(/^\d{1,3}$/)
      ? slugs.pop() || defaultBoardId
      : defaultBoardId
  )

  const mlsNumber = slugs.pop()

  // fallback for very short URLs
  if (slugs.length < 4) {
    return {
      address: capitalize(slugs.join(' ')),
      mlsNumber,
      boardId
    }
  }

  const code1 = slugs.at(-1) || ''
  const code2 = slugs.at(-2) || ''

  // canadian postal code: A1A 1A1  (letter-digit-letter, digit-letter-digit)
  const canadianPostal =
    /^[a-z]\d[a-z]$/.test(code2) && /^\d[a-z]\d$/.test(code1)
  // us postal code: 5 digits (12345)
  const usPostal = /^\d{5}$/.test(code1)

  let postalCode: string | undefined
  let rest: string[]
  if (canadianPostal) {
    postalCode = `${code2} ${code1}`.toUpperCase()
    rest = slugs.slice(0, -2)
  } else {
    postalCode = usPostal ? code1 : undefined
    rest = slugs.slice(0, -1)
  }

  const city = capitalize(rest.pop() || '')

  let unitNumber: string | undefined = undefined
  let streetNumber: string | undefined = undefined
  if (rest[0].length <= 4 && /^\d+$/.test(rest[1])) {
    // first part is a unit number
    unitNumber = rest[0].toUpperCase()
    streetNumber = rest[1]
  } else if (/^\d+$/.test(rest[0])) {
    streetNumber = rest[0]
  }

  rest = rest.slice(unitNumber ? 2 : 1)
  const streetSuffix = rest.pop() || ''
  const streetName = capitalize(rest.join(' '))

  return {
    unitNumber,
    streetNumber,
    streetName,
    streetSuffix,
    city,
    zip: postalCode,
    mlsNumber,
    boardId
  }
}
