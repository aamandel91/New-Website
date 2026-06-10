export interface AiSearchFilters {
  listingType: 'sale' | 'lease'
  propertyTypes: string[]
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  minBathrooms?: number
  minSqft?: number
  maxSqft?: number
  city?: string
  neighborhood?: string
}

export interface AiSearchListing {
  mlsNumber: string
  listPrice: number
  address?: {
    streetNumber?: string
    streetName?: string
    streetSuffix?: string
    streetDirection?: string
    city?: string
    state?: string
    zip?: string
  }
  details?: {
    numBedrooms?: number
    numBedroomsPlus?: number
    numBathrooms?: number
    numBathroomsPlus?: number
    numGarageSpaces?: number
    propertyType?: string
  }
  images?: string[]
  type?: string
  status?: string
  lastStatus?: string
  map?: { longitude?: number; latitude?: number }
  coordinates?: { lng?: number; lat?: number }
  longitude?: number
  latitude?: number
}

export type AiActivityLogEntry =
  | { id: string; ts: number; kind: 'prompt'; text: string }
  | { id: string; ts: number; kind: 'status'; text: string }
  | {
      id: string
      ts: number
      kind: 'understood'
      summary: string
      filters: Partial<AiSearchFilters>
    }
  | { id: string; ts: number; kind: 'error'; text: string }
