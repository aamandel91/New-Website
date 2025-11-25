import { cache } from 'react'

import searchConfig from '@configs/search'

import { APIPropertyDetails, type ApiQueryParams } from 'services/API'
import SearchService, { getListingFields } from 'services/Search'
import { parseSeoUrl } from 'utils/properties'

/**
 * Fetch property by MLS number
 * Cached for performance
 */
export const fetchProperty = cache(
  async (mlsNumber: string, boardId: number = searchConfig.defaultBoardId) => {
    return await APIPropertyDetails.fetchProperty(mlsNumber, boardId)
  }
)

/**
 * Fetch nearby properties for 404 page
 * Parse address from slug and search for similar properties
 */
export const fetchNearbies = cache(async (slug: string) => {
  try {
    const parsedAddress = parseSeoUrl(slug)
    const { streetName, streetSuffix, city, boardId } = parsedAddress
    const query = `${streetName} ${streetSuffix}, ${city}`

    const fetchParams: Partial<ApiQueryParams> = {
      search: query,
      searchFields: 'address.streetName,address.streetSuffix,address.city',
      boardId: boardId || searchConfig.defaultBoardId,
      status: 'A',
      type: 'sale',
      resultsPerPage: 4,
      class: ['condo', 'residential'],
      ...getListingFields()
    }

    const response = await SearchService.fetch(fetchParams)
    return response?.listings || []
  } catch (error) {
    console.error('[fetchNearbies] error', error)
    return []
  }
})
