import type { ApiQueryResponse, Property } from './types'
import APIClientSide from './APIClientSide'

const DEFAULT_BOARD_ID = 110

export interface CSRSearchParams {
  boardId?: number
  city?: string | string[]
  area?: string | string[]
  neighborhood?: string | string[]
  zip?: string
  class?: string | string[]
  propertyType?: string | string[]
  type?: string
  status?: string | string[]
  lastStatus?: string | string[]
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  maxBeds?: number
  minBaths?: number
  maxBaths?: number
  minSqft?: number
  maxSqft?: number
  minYearBuilt?: number
  maxYearBuilt?: number
  minLotSize?: number
  maxLotSize?: number
  minSoldDate?: string
  maxSoldDate?: string
  minListDate?: string
  maxListDate?: string
  resultsPerPage?: number
  pageNum?: number
  sortBy?: string
  fields?: string
  listings?: boolean | string
  aggregates?: string
  statistics?: string
  clusterPrecision?: number
  clusterLimit?: number
  clusterFields?: string
  map?: string
  search?: string
  searchFields?: string
  keywords?: string
  hasImages?: boolean
  displayAddressOnInternet?: string
  displayPublic?: string
  operator?: string
  condition?: string
  lat?: string
  long?: string
  radius?: number
  minOpenHouseDate?: string
  minParkingSpaces?: number
  minGarageSpaces?: number
}

class APISearchCSR extends APIClientSide {
  async searchListings(params: CSRSearchParams): Promise<ApiQueryResponse | null> {
    const { boardId = DEFAULT_BOARD_ID, resultsPerPage = 20, ...rest } = params
    return this.fetch('/listings', {
      boardId,
      resultsPerPage,
      ...rest,
    })
  }

  async getListing(mlsNumber: string, boardId: number = DEFAULT_BOARD_ID): Promise<Property | null> {
    return this.fetch(`/listings/${mlsNumber}`, { boardId })
  }

  async getLocations(boardId: number = DEFAULT_BOARD_ID) {
    return this.fetch('/listings', {
      boardId,
      listings: false,
      aggregates: 'address.city',
    })
  }
}

const apiSearchCSRInstance = new APISearchCSR()
export default apiSearchCSRInstance
