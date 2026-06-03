import React from 'react'
import { useTranslations } from 'next-intl'

import { DetailsContainer } from '@shared/Containers'
import { DetailsGroup, DetailsList } from '@shared/DetailsList'

import { usePropertyDetails } from 'providers/PropertyDetailsProvider'

const PropertyUnitInfoDetails = () => {
  const { propertyUnitInfo } = usePropertyDetails()
  const t = useTranslations()

  if (!propertyUnitInfo?.length) return null

  return (
    <DetailsContainer
      title={t('pdp.sections.propertyUnitInfo.name')}
      id="property-unit-info"
    >
      <DetailsList>
        {propertyUnitInfo.map((group) => (
          <DetailsGroup key={group.title} group={group} />
        ))}
      </DetailsList>
    </DetailsContainer>
  )
}

export default PropertyUnitInfoDetails
