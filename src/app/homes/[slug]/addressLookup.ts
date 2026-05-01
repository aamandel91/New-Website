import searchConfig from '@configs/search'
import type { Property } from 'services/API'
import APISearchCSR from 'services/API/APISearchCSR'
import { parseAddressSlug } from 'utils/propertyUrls'

export type ParsedAddress = {
  street: string
  city: string
  state: string
  zip: string
}

export async function fetchAddressListings(slug: string): Promise<{
  listings: Property[]
  parsed: ParsedAddress | null
}> {
  const parsed = parseAddressSlug(slug)
  if (!parsed) return { listings: [], parsed: null }

  const streetParts = parsed.street.trim().split(/\s+/)
  const streetNumber = streetParts[0] || ''
  const streetName = streetParts.slice(1).join(' ') || parsed.street

  const result = await APISearchCSR.getAddressHistory(
    streetNumber,
    streetName,
    parsed.city,
    searchConfig.defaultBoardId
  )

  return {
    listings: (result?.listings as Property[]) || [],
    parsed,
  }
}

export function findActiveListing(listings: Property[]): Property | undefined {
  return listings.find(
    (l) => l.status === 'A' && l.type?.toLowerCase() === 'sale'
  )
}
