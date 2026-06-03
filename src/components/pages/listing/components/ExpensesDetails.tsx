import React from 'react'
import { useTranslations } from 'next-intl'

import { DetailsContainer } from '@shared/Containers'
import { DetailsGroup, DetailsList } from '@shared/DetailsList'

import { usePropertyDetails } from 'providers/PropertyDetailsProvider'

const ExpensesDetails = () => {
  const { expenses } = usePropertyDetails()
  const t = useTranslations()

  if (!expenses?.length) return null

  return (
    <DetailsContainer title={t('pdp.sections.expenses.name')} id="expenses-taxes">
      <DetailsList>
        {expenses.map((group) => (
          <DetailsGroup key={group.title} group={group} />
        ))}
      </DetailsList>
    </DetailsContainer>
  )
}

export default ExpensesDetails
