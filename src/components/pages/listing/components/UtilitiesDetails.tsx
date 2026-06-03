import React from 'react'
import { useTranslations } from 'next-intl'

import { DetailsContainer } from '@shared/Containers'
import { DetailsGroup, DetailsList } from '@shared/DetailsList'

import { usePropertyDetails } from 'providers/PropertyDetailsProvider'

const UtilitiesDetails = () => {
  const { utilities } = usePropertyDetails()
  const t = useTranslations()

  if (!utilities?.length) return null

  return (
    <DetailsContainer title={t('pdp.sections.utilities.name')} id="utilities">
      <DetailsList>
        {utilities.map((group) => (
          <DetailsGroup key={group.title} group={group} />
        ))}
      </DetailsList>
    </DetailsContainer>
  )
}

export default UtilitiesDetails
