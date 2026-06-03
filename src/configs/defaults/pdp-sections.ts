import { type Property } from 'services/API'
import {
  mapperAccessibilityFeatures,
  mapperAcres,
  mapperAppliancesIncluded,
  mapperAssociationAmenities,
  mapperAssociationFee,
  mapperAssociationFeeIncludes,
  mapperAssociationFeePOTL,
  mapperBasementDevelopment,
  mapperBaths,
  mapperBathroomsTotal,
  mapperBuilderModel,
  mapperCategory,
  mapperCommunityFeatures,
  mapperConstructionMaterials,
  mapperConstructionYearBuilt,
  mapperDaysOnMarket,
  mapperDepthFt,
  mapperExclusions,
  mapperExterior,
  mapperExteriorFeatures,
  mapperFeaturesEquipmentIncluded,
  mapperFloorCovering,
  mapperFrontageFt,
  mapperInteriorFeatures,
  mapperLaundryFeatures,
  mapperLevels,
  mapperListDate,
  mapperListingTerms,
  mapperListingUpdatedOn,
  mapperLotFeatures,
  mapperLotSize,
  mapperNeighborhoodInfluences,
  mapperParcelNumber,
  mapperParkingDescription,
  mapperParkingType,
  mapperPatioAndPorchFeatures,
  mapperPoolFeatures,
  mapperPoolPrivate,
  mapperRentalEquipment,
  mapperSecondaryDwellingUnit,
  mapperSecurityFeatures,
  mapperSizeEstimated,
  mapperSoldDate,
  mapperStories,
  mapperSubdivision,
  mapperTaxesYear,
  mapperTotalBeds,
  mapperTotalParking,
  mapperUtilities,
  mapperView,
  mapperWaterfrontFeatures,
  mapperYesNo
} from 'utils/dataMapper/mappers'
import { toAffirmative, toSafeNumber } from 'utils/formatters'
import { scrubbed } from 'utils/properties'

const sections = {
  home: {
    name: 'pdp.sections.home.name', // ключ перевода вместо строки
    groups: [
      {
        items: [
          {
            label: 'pdp.fields.category',
            fn: mapperCategory
            // path: 'class'
          },
          { label: 'pdp.fields.style', path: 'details.propertyType' },
          { label: 'pdp.fields.type', path: 'details.style' },
          { label: 'pdp.fields.fronting', path: 'raw.FrontingOn' },
          {
            label: 'pdp.fields.secondaryDwellingUnit',
            fn: mapperSecondaryDwellingUnit
            // path: 'raw.HasSecondaryDwellingUnitYN'
          }
        ]
      },
      {
        items: [
          { label: 'pdp.fields.titleForm', path: 'raw.TitleForm' },
          {
            label: 'pdp.fields.taxesYear',
            fn: mapperTaxesYear
            // path: 'taxes.annualAmount, taxes.assessmentYear'
          },
          {
            label: 'pdp.fields.associationFeePOTL',
            fn: mapperAssociationFeePOTL
            // path: 'raw.AssocCommonAreaFeeAmt, raw.AssocFeeFrequency'
          }
        ]
      },
      {
        items: [
          { label: 'pdp.fields.status', path: 'lastStatus' },
          {
            label: 'pdp.fields.daysOnMarket',
            fn: mapperDaysOnMarket
            // path: 'listDate, soldDate'
          },
          {
            label: 'pdp.fields.listDate',
            fn: mapperListDate
            // path: 'listDate'
          },
          {
            label: 'pdp.fields.soldDate',
            fn: mapperSoldDate
            // path: 'soldDate'
          },
          {
            label: 'pdp.fields.listingUpdatedOn',
            fn: mapperListingUpdatedOn
            // path: 'updatedOn'
          }
        ]
      },
      {
        items: [
          { label: 'pdp.fields.yearBuilt', path: 'details.yearBuilt' },
          {
            label: 'pdp.fields.builderModel',
            fn: mapperBuilderModel
            // path: 'raw.BuilderName, raw.ModelName'
          },
          {
            label: 'pdp.fields.lotSize',
            fn: mapperLotSize
            // path: 'raw.LotSizeImpFrontage, raw.LotSizeImpDepth'
          }
        ]
      }
    ]
  },
  features: {
    name: 'pdp.sections.features.name',
    groups: [
      {
        title: 'pdp.sections.features.groups.bedsAndBaths',
        items: [
          {
            label: 'pdp.fields.totalBeds',
            fn: mapperTotalBeds
            // path: 'details.numBedrooms, details.numBedroomsPlus'
          },
          {
            label: 'pdp.fields.baths',
            fn: mapperBaths
            // path: '{details.numBathrooms} + {details.numBathroomsPlus}'
          },
          { label: 'pdp.fields.totalEnsuites', path: 'raw.EnsuiteBathrooms' },
          {
            label: 'pdp.fields.fireplaces',
            fn: (property: Property) => {
              const num = property.details.numFireplaces
              return scrubbed(num) ? num : toAffirmative(num)
            }
            // path: 'details.numFireplaces'
          },
          { label: 'pdp.fields.fuel', path: 'raw.FireplaceFuel' }
        ]
      },
      {
        title: 'pdp.sections.features.groups.basement',
        items: [
          { label: 'pdp.fields.type', path: 'details.basement1' },
          {
            label: 'pdp.fields.entrance',
            fn: mapperBasementDevelopment
            // path: 'details.basement2'
          }
        ]
      }
    ]
  },
  exterior: {
    name: 'pdp.sections.exterior.name',
    groups: [
      {
        title: 'pdp.sections.exterior.groups.exteriorFeatures',
        items: [
          {
            label: 'pdp.fields.exteriorFeatures',
            fn: mapperExteriorFeatures
            // path: 'raw.ExteriorFeatures'
          },
          {
            label: 'pdp.fields.patioAndPorchFeatures',
            fn: mapperPatioAndPorchFeatures
            // path: 'raw.PatioAndPorchFeatures'
          }
        ]
      },
      {
        title: 'pdp.sections.exterior.groups.pool',
        items: [
          {
            label: 'pdp.fields.poolFeatures',
            fn: mapperPoolFeatures
            // path: 'raw.PoolFeatures'
          },
          {
            label: 'pdp.fields.poolPrivate',
            fn: mapperPoolPrivate
            // path: 'raw.PoolPrivateYN'
          }
        ]
      },
      {
        title: 'pdp.sections.exterior.groups.parkingAndGarage',
        items: [
          {
            label: 'pdp.fields.totalParking',
            fn: mapperTotalParking
            // path: '{details.numParkingSpaces + details.numGarageSpaces}'
          },
          {
            label: 'pdp.fields.garageSpaces',
            fn: (property: Property) =>
              toSafeNumber(property.details.numGarageSpaces)
            // path: 'details.numGarageSpaces'
          },
          {
            label: 'pdp.fields.coveredSpaces',
            path: 'raw.NumberofCoveredSpaces'
          },
          { label: 'pdp.fields.garageType', path: 'details.garage' },
          { label: 'pdp.fields.driveway', path: 'details.driveway' },
          {
            label: 'pdp.fields.parkingDescription',
            fn: mapperParkingDescription
            // path: 'raw.ParkingDesc'
          },
          {
            label: 'pdp.fields.parkingType',
            fn: mapperParkingType
            // path: 'condominium.parkingType'
          }
        ]
      },
      {
        title: 'pdp.sections.exterior.groups.construction',
        items: [
          {
            label: 'pdp.fields.yearBuilt',
            fn: mapperConstructionYearBuilt
            // path: '{details.yearBuilt} {raw.AgeDescription}',
          },
          {
            label: 'pdp.fields.builderModel',
            fn: mapperBuilderModel
            // path: 'raw.BuilderName, raw.ModelName',
          },
          {
            label: 'pdp.fields.sizeEstimated',
            fn: mapperSizeEstimated
            // path: 'details.sqft, rooms',
          }
        ]
      },
      {
        title: 'pdp.sections.exterior.groups.lot',
        items: [
          {
            label: 'pdp.fields.acres',
            fn: mapperAcres
            // path: 'raw.LotSizeImpFrontage, raw.LotSizeImpDepth',
          },
          {
            label: 'pdp.fields.frontage',
            fn: mapperFrontageFt
            // path: 'raw.LotSizeImpFrontage',
          },
          {
            label: 'pdp.fields.depth',
            fn: mapperDepthFt
            // path: 'raw.LotSizeImpDepth',
          },
          { label: 'pdp.fields.irregularShape', path: 'lot.irregular' },
          { label: 'pdp.fields.lotImprovements', path: 'raw.LotImprovements' },
          {
            label: 'pdp.fields.parcelNumber',
            fn: mapperParcelNumber
            // path: 'raw.ParcelNumber'
          },
          {
            label: 'pdp.fields.lotFeatures',
            fn: mapperLotFeatures
            // path: 'raw.LotFeatures'
          }
        ]
      },
      {
        title: 'pdp.sections.exterior.groups.constructionDetails',
        items: [
          {
            label: 'pdp.fields.foundationType',
            path: 'details.foundationType'
          },
          { label: 'pdp.fields.roofMaterial', path: 'details.roofMaterial' },
          {
            label: 'pdp.fields.exterior',
            fn: mapperExterior
            // path: 'details.exteriorConstruction1',
          },
          {
            label: 'pdp.fields.floorCovering',
            fn: mapperFloorCovering
            // path: 'raw.FloorCovering',
          },
          { label: 'pdp.fields.sizeEstimated', path: 'details.sqft, rooms' }
        ]
      },
      {
        title: 'pdp.sections.exterior.groups.legal',
        items: [
          { label: 'pdp.fields.legalDescription', path: 'lot.legalDescription' }
        ]
      }
    ]
  },
  appliances: {
    name: 'pdp.sections.appliances.name',
    groups: [
      {
        title: 'pdp.sections.appliances.groups.appliancesIncluded',
        items: [
          {
            label: 'pdp.fields.appliancesIncluded',
            fn: mapperAppliancesIncluded
            // path: 'raw.AppliancesIncluded',
          }
        ]
      },
      {
        title: 'pdp.sections.appliances.groups.exclusions',
        items: [
          {
            label: 'pdp.fields.exclusions',
            fn: mapperExclusions
            // path: 'raw.Exclusions',
          }
        ]
      },
      {
        title: 'pdp.sections.appliances.groups.featuresEquipmentIncluded',
        items: [
          {
            label: 'pdp.fields.featuresEquipmentIncluded',
            fn: mapperFeaturesEquipmentIncluded
            // path: 'raw.FeaturesEquipmentIncluded'
          }
        ]
      },
      {
        title: 'pdp.sections.appliances.groups.rentalEquipment',
        items: [
          {
            label: 'pdp.fields.rentalEquipment',
            fn: mapperRentalEquipment
            // path: 'raw.RentalEquipment'
          }
        ]
      }
    ]
  },
  neighborhood: {
    name: 'pdp.sections.neighborhood.name',
    groups: [
      {
        title: '',
        items: [
          {
            // TODO: filterEmptyGroups should NOT remove groups with empty `label`

            // this label will not be shown due to the design of the section,
            // but added here temporarily to avoid filtering
            label: 'pdp.fields.neighborhoodInfluences',
            fn: mapperNeighborhoodInfluences
            // path: 'nearby.amenities'
          }
        ]
      }
    ]
  },
  propertyUnitInfo: {
    name: 'pdp.sections.propertyUnitInfo.name',
    groups: [
      {
        title: 'pdp.sections.propertyUnitInfo.groups.propertyInfo',
        items: [
          {
            label: 'pdp.fields.furnished',
            fn: (p: Property) => mapperYesNo(p, 'Furnished') || p.raw?.Furnished
          },
          {
            label: 'pdp.fields.propertyCondition',
            path: 'raw.PropertyCondition'
          },
          {
            label: 'pdp.fields.securityFeatures',
            fn: mapperSecurityFeatures
          },
          {
            label: 'pdp.fields.petsAllowed',
            fn: (p: Property) => mapperYesNo(p, 'PetsAllowed') || p.raw?.PetsAllowed
          },
          { label: 'pdp.fields.view', fn: mapperView },
          {
            label: 'pdp.fields.accessibilityFeatures',
            fn: mapperAccessibilityFeatures
          },
          { label: 'pdp.fields.levels', fn: mapperLevels }
        ]
      },
      {
        title: 'pdp.sections.propertyUnitInfo.groups.buildingInfo',
        items: [
          { label: 'pdp.fields.style', path: 'details.style' },
          { label: 'pdp.fields.type', path: 'details.propertyType' },
          { label: 'pdp.fields.subType', path: 'raw.PropertySubType' },
          { label: 'pdp.fields.yearBuilt', path: 'details.yearBuilt' },
          { label: 'pdp.fields.stories', fn: mapperStories },
          {
            label: 'pdp.fields.constructionMaterials',
            fn: mapperConstructionMaterials
          },
          { label: 'pdp.fields.roofMaterial', path: 'details.roofMaterial' }
        ]
      },
      {
        title: 'pdp.sections.propertyUnitInfo.groups.bedroomDetails',
        items: [
          { label: 'pdp.fields.bedroomsTotal', fn: mapperTotalBeds }
        ]
      },
      {
        title: 'pdp.sections.propertyUnitInfo.groups.bathroomDetails',
        items: [
          {
            label: 'pdp.fields.fullBathrooms',
            path: 'details.numBathrooms'
          },
          {
            label: 'pdp.fields.halfBathrooms',
            path: 'details.numBathroomsPlus'
          },
          { label: 'pdp.fields.bathroomsTotal', fn: mapperBathroomsTotal }
        ]
      },
      {
        title: 'pdp.sections.propertyUnitInfo.groups.kitchenDetails',
        items: [
          {
            label: 'pdp.fields.appliancesIncluded',
            fn: mapperAppliancesIncluded
          }
        ]
      },
      {
        title: 'pdp.sections.propertyUnitInfo.groups.interiorFeatures',
        items: [
          {
            label: 'pdp.fields.interiorFeatures',
            fn: mapperInteriorFeatures
          },
          { label: 'pdp.fields.floorCovering', fn: mapperFloorCovering },
          {
            label: 'pdp.fields.laundryFeatures',
            fn: mapperLaundryFeatures
          }
        ]
      }
    ]
  },
  hoaLocationSchools: {
    name: 'pdp.sections.hoaLocationSchools.name',
    groups: [
      {
        title: 'pdp.sections.hoaLocationSchools.groups.locationInfo',
        items: [
          { label: 'pdp.fields.county', path: 'address.county' },
          { label: 'pdp.fields.area', path: 'raw.Area' },
          { label: 'pdp.fields.subdivision', fn: mapperSubdivision },
          {
            label: 'pdp.fields.waterfrontFeatures',
            fn: mapperWaterfrontFeatures
          }
        ]
      },
      {
        title: 'pdp.sections.hoaLocationSchools.groups.hoa',
        items: [
          { label: 'pdp.fields.associationFee', fn: mapperAssociationFee },
          { label: 'pdp.fields.associationFeeFrequency', path: 'raw.AssocFeeFrequency' },
          { label: 'pdp.fields.associationName', path: 'raw.AssociationName' },
          {
            label: 'pdp.fields.associationFeeIncludes',
            fn: mapperAssociationFeeIncludes
          },
          {
            label: 'pdp.fields.associationAmenities',
            fn: mapperAssociationAmenities
          },
          {
            label: 'pdp.fields.communityFeatures',
            fn: mapperCommunityFeatures
          }
        ]
      },
      {
        title: 'pdp.sections.hoaLocationSchools.groups.schoolInfo',
        items: [
          {
            label: 'pdp.fields.elementarySchool',
            path: 'raw.ElementarySchool'
          },
          {
            label: 'pdp.fields.middleSchool',
            path: 'raw.MiddleOrJuniorSchool'
          },
          { label: 'pdp.fields.highSchool', path: 'raw.HighSchool' }
        ]
      }
    ]
  },
  expenses: {
    name: 'pdp.sections.expenses.name',
    groups: [
      {
        title: 'pdp.sections.expenses.groups.taxesFinancesTerms',
        items: [
          { label: 'pdp.fields.taxYear', path: 'taxes.assessmentYear' },
          { label: 'pdp.fields.taxAnnualAmount', path: 'taxes.annualAmount' },
          { label: 'pdp.fields.listingTerms', fn: mapperListingTerms }
        ]
      }
    ]
  },
  utilities: {
    name: 'pdp.sections.utilities.name',
    groups: [
      {
        title: 'pdp.sections.utilities.groups.utilityHeatingCooling',
        items: [
          { label: 'pdp.fields.heatingType', path: 'details.heating' },
          {
            label: 'pdp.fields.airConditioning',
            path: 'details.airConditioning'
          },
          { label: 'pdp.fields.utilities', fn: mapperUtilities },
          { label: 'pdp.fields.sewer', path: 'details.sewer' },
          { label: 'pdp.fields.waterSupply', path: 'details.waterSource' }
        ]
      }
    ]
  }
}

export default sections
