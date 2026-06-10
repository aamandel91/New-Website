/**
 * Shared property fetcher for marketing feed generation
 * Fetches listings from the Repliers CSR API and maps Property → RemarketingPropertyData
 */

import type { Property } from 'services/API'
import { APISearch } from 'services/API'
import APISearchCSR from 'services/API/APISearchCSR'
import { generatePropertyUrl } from 'utils/propertyUrls'

import type { RemarketingPropertyData } from './types'

const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://example.com'
const useCSR = !!process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY
const defaultBoardId = useCSR ? 110 : 2

function mapAvailability(
  status: string,
  lastStatus: string
): RemarketingPropertyData['availability'] {
  if (status === 'U' && lastStatus === 'Sld') return 'sold'
  if (status === 'U' && lastStatus === 'Lsd') return 'sold'
  if (
    status === 'U' &&
    (lastStatus === 'Sc' || lastStatus === 'Pc' || lastStatus === 'Lc')
  )
    return 'pending'
  if (status === 'A') return 'for sale'
  return 'for sale'
}

function mapPropertyToRemarketing(property: Property): RemarketingPropertyData {
  const addr = property.address
  const street = [addr.streetNumber, addr.streetName, addr.streetSuffix]
    .filter(Boolean)
    .join(' ')
  const name = [street, addr.city, addr.state, addr.zip]
    .filter(Boolean)
    .join(', ')

  const url = generatePropertyUrl(
    {
      street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip
    },
    property.mlsNumber
  )

  return {
    id: property.mlsNumber,
    listing_id: property.mlsNumber,
    name,
    address: street,
    city: addr.city || '',
    region: addr.state || '',
    country: addr.country || 'US',
    postal_code: addr.zip || '',
    price: parseFloat(property.listPrice) || 0,
    currency: 'USD',
    property_type:
      property.details?.propertyType || property.details?.style || '',
    bedrooms: parseInt(property.details?.numBedrooms) || 0,
    bathrooms: parseInt(property.details?.numBathrooms) || 0,
    square_feet: parseFloat(property.details?.sqft) || 0,
    image_url: property.images?.[0] || '',
    url: `${baseUrl}${url}`,
    availability: mapAvailability(property.status, property.lastStatus),
    latitude: property.map?.latitude,
    longitude: property.map?.longitude
  }
}

export interface FetchFeedPropertiesOptions {
  limit?: number
  offset?: number
  city?: string
  propertyType?: string
  status?: string
  minPrice?: number
  maxPrice?: number
}

export async function fetchFeedProperties(
  options: FetchFeedPropertiesOptions = {}
): Promise<RemarketingPropertyData[]> {
  const {
    limit = 1000,
    offset = 0,
    city,
    propertyType,
    status = 'A',
    minPrice,
    maxPrice
  } = options

  const page = Math.floor(offset / limit) + 1

  try {
    let response

    if (useCSR) {
      response = await APISearchCSR.searchListings({
        boardId: defaultBoardId,
        pageNum: page,
        resultsPerPage: limit,
        status,
        type: 'sale',
        ...(city && { city }),
        ...(propertyType && { propertyType }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice })
      })
    } else {
      const getParams: Record<string, string | number> = {
        boardId: defaultBoardId,
        pageNum: page,
        resultsPerPage: limit,
        status,
        type: 'sale'
      }

      if (city) getParams.city = city
      if (propertyType) getParams.propertyType = propertyType
      if (minPrice) getParams.minPrice = minPrice
      if (maxPrice) getParams.maxPrice = maxPrice

      response = await APISearch.fetch({ get: getParams }, {
        next: { revalidate: 3600 }
      } as any)
    }

    if (!response?.listings) return []

    return response.listings.map(mapPropertyToRemarketing)
  } catch (error) {
    console.error('[FeedProperties] Error fetching properties:', error)
    return []
  }
}
