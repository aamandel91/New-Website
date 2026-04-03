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
  minBedrooms?: number
  maxBedrooms?: number
  minBeds?: number   // alias — mapped to minBedrooms
  maxBeds?: number   // alias — mapped to maxBedrooms
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
    const { boardId = DEFAULT_BOARD_ID, resultsPerPage = 20, minBeds, maxBeds, ...rest } = params
    // Map aliases to correct API parameter names
    const mapped: Record<string, unknown> = {
      boardId,
      resultsPerPage,
      ...rest,
    }
    // The Repliers API uses minBedrooms/maxBedrooms (not minBeds/maxBeds)
    if (minBeds !== undefined && mapped.minBedrooms === undefined) mapped.minBedrooms = minBeds
    if (maxBeds !== undefined && mapped.maxBedrooms === undefined) mapped.maxBedrooms = maxBeds
    return this.fetch('/listings', mapped)
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

  async getAddressHistory(
    streetNumber: string,
    streetName: string,
    city: string,
    boardId: number = DEFAULT_BOARD_ID
  ): Promise<ApiQueryResponse | null> {
    return this.fetch('/listings', {
      boardId,
      'address.streetNumber': streetNumber,
      'address.streetName': streetName,
      'address.city': city,
      status: 'A,U',
      sortBy: 'updatedOnDesc',
      resultsPerPage: 50,
    })
  }
}

const apiSearchCSRInstance = new APISearchCSR()
export default apiSearchCSRInstance
