import React from 'react'
import { useTranslations } from 'next-intl'

import { DetailsContainer } from '@shared/Containers'
import { DetailsGroup, DetailsList } from '@shared/DetailsList'

import { usePropertyDetails } from 'providers/PropertyDetailsProvider'

const HoaLocationSchoolsDetails = () => {
  const { hoaLocationSchools } = usePropertyDetails()
  const t = useTranslations()

  if (!hoaLocationSchools?.length) return null

  return (
    <DetailsContainer
      title={t('pdp.sections.hoaLocationSchools.name')}
      id="hoa-location-schools"
    >
      <DetailsList>
        {hoaLocationSchools.map((group) => (
          <DetailsGroup key={group.title} group={group} />
        ))}
      </DetailsList>
    </DetailsContainer>
  )
}

export default HoaLocationSchoolsDetails
