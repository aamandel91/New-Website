import { type Property } from 'services/API'

import {
  appliancesResolver,
  expensesResolver,
  exteriorResolver,
  featuresResolver,
  hoaLocationSchoolsResolver,
  homeResolver,
  neighborhoodResolver,
  propertyUnitInfoResolver,
  roomsResolver,
  utilitiesResolver
} from './residential'

const resolver = (property: Property) => {
  return {
    homeDetails: homeResolver(property),
    features: featuresResolver(property),
    appliances: appliancesResolver(property),
    neighborhood: neighborhoodResolver(property),
    exterior: exteriorResolver(property),
    rooms: roomsResolver(property),
    propertyUnitInfo: propertyUnitInfoResolver(property),
    hoaLocationSchools: hoaLocationSchoolsResolver(property),
    expenses: expensesResolver(property),
    utilities: utilitiesResolver(property)
  }
}

export default resolver
