import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'

import { type Property } from 'services/API'
import {
  formatDate,
  formatEnglishPrice,
  type Primitive
} from 'utils/formatters'
import { SQFT_PER_ACRE } from 'utils/numbers'
import { sold } from 'utils/properties'
import { addSpaceAfterComma, joinNonEmpty, pluralize } from 'utils/strings'

import {
  isEmptyValue,
  sanitizeItems,
  sanitizeStringWithDelimiter
} from './utils'

const joinWithSlash = (a: Primitive, b: Primitive) =>
  joinNonEmpty([a, b], ' / ')

dayjs.extend(utc)

/**
 * Custom mappers for Property type
 */

export function mapperCategory(property: Property) {
  return property.class?.replace('Property', '') ?? null
}

export function mapperDaysOnMarket(property: Property) {
  const isNew = property.lastStatus === 'New'
  if (!sold(property)) {
    const date = isNew ? property.listDate : property.soldDate
    const days = dayjs().diff(date, 'day') || 0
    return pluralize(days, {
      zero: 'listed today',
      one: '$ day ago',
      many: '$ days ago'
    })
  }
  return null
}

export function mapperListDate(property: Property) {
  if (sold(property) && property.type !== 'Lease') return null
  return formatDate(property.listDate, { utc: true })
}

export function mapperSoldDate(property: Property) {
  return formatDate(property.soldDate, { utc: true })
}

export function mapperListingUpdatedOn(property: Property) {
  return formatDate(property.updatedOn, { utc: true })
}

export function mapperSecondaryDwellingUnit(property: Property) {
  const value = property.raw?.HasSecondaryDwellingUnitYN
  return typeof value === 'undefined'
    ? null
    : Number(value) === 0
      ? 'No'
      : 'Yes'
}

export function mapperBuilderModel(property: Property) {
  const builderName = property.raw?.BuilderName
  const modelName = property.raw?.ModelName
  return joinNonEmpty([builderName, modelName], ' / ') || null
}

export function mapperLotSize(property: Property) {
  const frontage = property.raw?.LotSizeImpFrontage
  const depth = property.raw?.LotSizeImpDepth
  if (frontage && depth) {
    const value = (+frontage * +depth) / SQFT_PER_ACRE
    const formattedValue = parseFloat(value.toFixed(2))
    return !isEmptyValue(formattedValue) ? `${formattedValue} acres` : null
  }
  return null
}

export function mapperTaxesYear(property: Property) {
  const { annualAmount, assessmentYear } = property.taxes || {}
  return joinWithSlash(
    annualAmount ? formatEnglishPrice(Number(annualAmount)) : '',
    assessmentYear
  )
}

export function mapperAssociationFeePOTL(property: Property) {
  const feeAmt = property.raw?.AssocCommonAreaFeeAmt
  const feeFreq = property.raw?.AssocFeeFrequency
  const value = joinWithSlash(feeAmt, feeFreq)
  return !isEmptyValue(value) ? `$${value}` : null
}

export function mapperSizeEstimated() {
  // const sqft = getSqft(properties)
  //
  // return sqft.label

  // force hide Size (estimated) for now
  return null
}

export function mapperTotalBeds(property: Property) {
  const { numBedrooms, numBedroomsPlus } = property.details
  return joinNonEmpty([+numBedrooms, +numBedroomsPlus], ' + ')
}

export function mapperBaths(property: Property) {
  const { numBathrooms, numBathroomsPlus } = property.details
  return joinNonEmpty([+numBathrooms, +numBathroomsPlus], ' + ')
}

export function mapperTotalParking(property: Property) {
  const { numParkingSpaces, numGarageSpaces } = property.details
  return joinNonEmpty([+numGarageSpaces, +numParkingSpaces], ' + ')
}

export function mapperAppliancesIncluded(property: Property) {
  const appliances = property.raw?.AppliancesIncluded
  return sanitizeStringWithDelimiter(appliances)
}

export function mapperExclusions(property: Property) {
  const exclusions = property.raw?.Exclusions
  return sanitizeStringWithDelimiter(exclusions, /[,&]/)
}

export function mapperFeaturesEquipmentIncluded(property: Property) {
  const features = property.raw?.FeaturesEquipmentIncluded
  return sanitizeStringWithDelimiter(features)
}

export function mapperRentalEquipment(property: Property) {
  const rentalEquipment = property.raw?.RentalEquipment
  if (rentalEquipment) {
    const input = rentalEquipment.split(/\r?\n/)
    return input
      .map((line) => {
        if (/Water Heater|Hot Water Tank/.test(line)) return 'HWT'
        if (/Water Softener/.test(line)) return 'Furnace'
        if (/AC/.test(line)) return 'AC'
        return null
      })
      .filter(Boolean)
  }
  return null
}

export function mapperNeighborhoodInfluences(property: Property) {
  const { ammenities } = property.nearby || {}
  return sanitizeItems(ammenities)
}

export function mapperConstructionYearBuilt(property: Property) {
  const { yearBuilt } = property.details
  const ageDescription = property.raw?.AgeDescription
  return yearBuilt && !isEmptyValue(yearBuilt)
    ? `${yearBuilt} ${ageDescription || ''}`.replace('Unknown', '').trim()
    : null
}

export function mapperAcres(property: Property) {
  return mapperLotSize(property)
}

export function mapperFrontageFt(property: Property) {
  const frontage = property.raw?.LotSizeImpFrontage
  return frontage && !isEmptyValue(frontage)
    ? `${Math.floor(+frontage)} ft`
    : null
}

export function mapperDepthFt(property: Property) {
  const depth = property.raw?.LotSizeImpDepth
  return depth && !isEmptyValue(depth) ? `${Math.floor(+depth)} ft` : null
}

export function mapperSpecialAssessment(property: Property) {
  const year = property.raw?.AssessmentYear
  const amount = property.raw?.AssessmentAmount
  return joinNonEmpty([year, amount], ' / ') || null
}

export function mapperLaundry(property: Property) {
  const { ensuiteLaundry } = property.condominium || {}
  const laundryFacilities = property.raw?.LaundryFacilities
  return joinNonEmpty([ensuiteLaundry, laundryFacilities], ' | ') || null
}

export function mapperCCPName(property: Property) {
  const { condoCorp, condoCorpNum } = property.condominium || {}
  return joinNonEmpty([condoCorpNum, condoCorp], ' / ') || null
}

export function mapperLevelsUnit(property: Property) {
  const levels = property.raw?.NumberofLevelsInUnit

  if (!levels) return null

  const roundDown = Math.floor(+levels)
  return !Number.isNaN(roundDown) ? roundDown : null
}

export function mapperSpaceAfterComma(property: Property, key: string) {
  const value = property.raw?.[key]
  return value ? addSpaceAfterComma(value) : null
}

export function mapperFloorCovering(property: Property) {
  return mapperSpaceAfterComma(property, 'FloorCovering')
}

export function mapperParkingDescription(property: Property) {
  return mapperSpaceAfterComma(property, 'ParkingDesc')
}

export function mapperFeeIncludes(property: Property) {
  return mapperSpaceAfterComma(property, 'FeeIncludes')
}

export function mapperExterior(property: Property) {
  const exterior = property.details?.exteriorConstruction1
  return exterior ? addSpaceAfterComma(exterior) : null
}

export function mapperParkingType(property: Property) {
  const { parkingType } = property?.condominium || {}
  return parkingType ? addSpaceAfterComma(parkingType) : null
}

export function mapperCondoFees(property: Property) {
  const { maintenance } = property?.condominium?.fees || {}
  const condoFeeFrequency = property.raw?.CondoFeeFrequency

  if (maintenance) {
    const rounded = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })
      .format(parseFloat(maintenance))
      .replace('.00', '')
    return !rounded.includes('NaN')
      ? joinNonEmpty([rounded, condoFeeFrequency], ' / ')
      : null
  }
  return null
}

export const mapperBasementDevelopment = (property: Property) =>
  property.details.basement2 === 'W/O' ? 'Walk-Out' : property.details.basement2

/**
 * Generic helper: read a `raw.*` field that may be a comma/semicolon-delimited
 * list and return a clean, comma-joined string. Returns null when empty so the
 * row is hidden by `filterEmptyGroups`.
 */
export function mapperRawList(property: Property, key: string) {
  const value = property.raw?.[key]
  const items = sanitizeStringWithDelimiter(value, /[,;]/)
  return items && items.length ? items.join(', ') : null
}

/**
 * Generic helper for boolean-ish `raw.*` Y/N or 1/0 fields.
 */
export function mapperYesNo(property: Property, key: string) {
  const value = property.raw?.[key]
  if (value === undefined || value === null || value === '') return null
  const s = String(value).trim().toLowerCase()
  if (s === '1' || s === 'y' || s === 'yes' || s === 'true') return 'Yes'
  if (s === '0' || s === 'n' || s === 'no' || s === 'false') return 'No'
  return String(value)
}

export function mapperInteriorFeatures(property: Property) {
  return mapperRawList(property, 'InteriorFeatures')
}

export function mapperLaundryFeatures(property: Property) {
  return mapperRawList(property, 'LaundryFeatures')
}

export function mapperExteriorFeatures(property: Property) {
  return mapperRawList(property, 'ExteriorFeatures')
}

export function mapperPatioAndPorchFeatures(property: Property) {
  return mapperRawList(property, 'PatioAndPorchFeatures')
}

export function mapperPoolFeatures(property: Property) {
  return mapperRawList(property, 'PoolFeatures')
}

export function mapperPoolPrivate(property: Property) {
  return mapperYesNo(property, 'PoolPrivateYN')
}

export function mapperLotFeatures(property: Property) {
  return mapperRawList(property, 'LotFeatures')
}

export function mapperSecurityFeatures(property: Property) {
  return mapperRawList(property, 'SecurityFeatures')
}

export function mapperAccessibilityFeatures(property: Property) {
  return mapperRawList(property, 'AccessibilityFeatures')
}

export function mapperAssociationAmenities(property: Property) {
  return mapperRawList(property, 'AssociationAmenities')
}

export function mapperCommunityFeatures(property: Property) {
  return mapperRawList(property, 'CommunityFeatures')
}

export function mapperAssociationFeeIncludes(property: Property) {
  return mapperRawList(property, 'AssociationFeeIncludes')
}

export function mapperUtilities(property: Property) {
  return mapperRawList(property, 'Utilities')
}

export function mapperListingTerms(property: Property) {
  return mapperRawList(property, 'ListingTerms')
}

export function mapperView(property: Property) {
  const view =
    (property.details as { viewType?: string })?.viewType ||
    property.raw?.View
  return view ? addSpaceAfterComma(String(view)) : null
}

export function mapperConstructionMaterials(property: Property) {
  const raw = property.raw?.ConstructionMaterials
  if (raw) return addSpaceAfterComma(raw)
  return mapperExterior(property)
}

export function mapperLevels(property: Property) {
  const levels = property.raw?.Levels
  if (levels) return String(levels)
  return mapperStories(property)
}

export function mapperStories(property: Property) {
  const stories =
    property.raw?.Stories ||
    (property.details as { numStories?: string })?.numStories ||
    property.condominium?.stories
  return stories ? String(stories) : null
}

export function mapperBathroomsTotal(property: Property) {
  const { numBathrooms, numBathroomsPlus } = property.details || {}
  const total = (+numBathrooms || 0) + (+numBathroomsPlus || 0)
  return total > 0 ? String(total) : null
}

/**
 * HOA association fee. Prefers the normalized condominium maintenance fee,
 * falls back to the raw AssocFee field. Frequency is rendered as a separate
 * row by mapperAssocFeeFrequency.
 */
export function mapperAssociationFee(property: Property) {
  const maintenance = property.condominium?.fees?.maintenance
  const assocFee = property.raw?.AssocFee
  const amount = maintenance || assocFee
  if (!amount) return null
  const num = parseFloat(String(amount))
  if (Number.isNaN(num) || num === 0) return null
  return formatEnglishPrice(num)
}

/**
 * Parcel number from the raw feed, falling back to the normalized lot field
 * when present.
 */
export function mapperParcelNumber(property: Property) {
  const parcel =
    property.raw?.ParcelNumber ||
    (property.lot as { parcelNumber?: string })?.parcelNumber
  return parcel ? String(parcel) : null
}

/**
 * Subdivision name: prefer the normalized neighborhood, fall back to the raw
 * SubdivisionName.
 */
export function mapperSubdivision(property: Property) {
  const neighborhood = property.address?.neighborhood
  const subdivision = property.raw?.SubdivisionName
  return neighborhood || subdivision || null
}

/**
 * Waterfront features. Prefer the raw list, fall back to the normalized
 * `details.waterfront` flag.
 */
export function mapperWaterfrontFeatures(property: Property) {
  const raw = mapperRawList(property, 'WaterfrontFeatures')
  if (raw) return raw
  const waterfront = (property.details as { waterfront?: string })?.waterfront
  return waterfront ? String(waterfront) : null
}
