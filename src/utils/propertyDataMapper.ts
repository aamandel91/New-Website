import { type Property } from 'services/API'

/**
 * Maps Property API data to the format expected by components
 * This normalizes field names and types for easier component consumption
 */
export interface NormalizedProperty extends Property {
  // Normalized fields for easier access
  price?: number
  beds?: number
  baths?: number
  sqft?: number
  yearBuilt?: number
  description?: string
  propertyType?: string
  hoa?: number
  lotSize?: number
  neighborhood?: string
  county?: string
  schoolDistrict?: string
  listingDate?: string
  agent?: {
    name?: string
    phone?: string | number
    email?: string
    photo?: string
    license?: string
  }
  virtualTourUrl?: string
  features?: Record<string, string | string[]>
  originalPrice?: number
}

/**
 * Normalizes a Property object from API format to component-friendly format
 */
export function normalizeProperty(property: Property): NormalizedProperty {
  const normalized = property as NormalizedProperty

  // Price - convert from string to number
  normalized.price = property.listPrice ? parseFloat(property.listPrice) : undefined

  // Original price
  normalized.originalPrice = property.originalPrice
    ? parseFloat(property.originalPrice)
    : normalized.price

  // Beds
  normalized.beds = property.details?.numBedrooms
    ? parseInt(property.details.numBedrooms)
    : undefined

  // Baths
  normalized.baths = property.details?.numBathrooms
    ? parseInt(property.details.numBathrooms)
    : undefined

  // Square footage
  normalized.sqft = property.details?.sqft ? parseFloat(property.details.sqft) : undefined

  // Year built
  normalized.yearBuilt = property.details?.yearBuilt
    ? parseInt(property.details.yearBuilt)
    : undefined

  // Description
  normalized.description = property.details?.description

  // Property type
  normalized.propertyType = property.details?.propertyType

  // HOA fees
  normalized.hoa =
    property.condominium?.fees?.maintenance
      ? parseFloat(property.condominium.fees.maintenance)
      : property.condominium?.maintenance
      ? parseFloat(property.condominium.maintenance)
      : undefined

  // Lot size - prefer acres, fallback to size
  normalized.lotSize = property.lot?.acres || property.lot?.size || undefined

  // Neighborhood
  normalized.neighborhood = property.address?.neighborhood

  // County (using district as proxy)
  normalized.county = property.address?.district

  // School district (not available in API)
  normalized.schoolDistrict = undefined

  // Listing date
  normalized.listingDate = property.listDate

  // Virtual tour URL
  normalized.virtualTourUrl = property.details?.virtualTourUrl

  // Agent - use first agent from agents array
  if (property.agents && property.agents.length > 0) {
    const agent = property.agents[0]
    normalized.agent = {
      name: agent.name,
      phone: agent.phones && agent.phones.length > 0 ? agent.phones[0] : undefined,
      email: agent.email || undefined,
      photo: agent.photo?.large || agent.photo?.small,
      license: undefined, // Not available in API
    }
  }

  // Features - map from details object
  if (property.details) {
    const features: Record<string, string | string[]> = {}

    // Interior features
    const interior: string[] = []
    if (property.details.airConditioning)
      interior.push(`Air Conditioning: ${property.details.airConditioning}`)
    if (property.details.heating) interior.push(`Heating: ${property.details.heating}`)
    if (property.details.basement1) interior.push(`Basement: ${property.details.basement1}`)
    if (property.details.numFireplaces)
      interior.push(`Fireplaces: ${property.details.numFireplaces}`)
    if (property.details.flooringType)
      interior.push(`Flooring: ${property.details.flooringType}`)
    if (interior.length > 0) features['Interior'] = interior

    // Exterior features
    const exterior: string[] = []
    if (property.details.exteriorConstruction1)
      exterior.push(`Construction: ${property.details.exteriorConstruction1}`)
    if (property.details.driveway) exterior.push(`Driveway: ${property.details.driveway}`)
    if (property.details.garage) exterior.push(`Garage: ${property.details.garage}`)
    if (property.details.patio) exterior.push(`Patio: ${property.details.patio}`)
    if (property.details.swimmingPool) exterior.push(`Pool: ${property.details.swimmingPool}`)
    if (exterior.length > 0) features['Exterior'] = exterior

    // Parking
    const parking: string[] = []
    if (property.details.numGarageSpaces)
      parking.push(`Garage Spaces: ${property.details.numGarageSpaces}`)
    if (property.details.numParkingSpaces)
      parking.push(`Parking Spaces: ${property.details.numParkingSpaces}`)
    if (parking.length > 0) features['Parking'] = parking

    // Utilities
    const utilities: string[] = []
    if (property.details.waterSource) utilities.push(`Water: ${property.details.waterSource}`)
    if (property.details.sewer) utilities.push(`Sewer: ${property.details.sewer}`)
    if (utilities.length > 0) features['Utilities'] = utilities

    // Additional details
    if (property.details.extras) {
      features['Additional Features'] = property.details.extras.split(',').map(s => s.trim())
    }

    normalized.features = features
  }

  return normalized
}

/**
 * Normalizes an array of properties
 */
export function normalizeProperties(properties: Property[]): NormalizedProperty[] {
  return properties.map(normalizeProperty)
}
