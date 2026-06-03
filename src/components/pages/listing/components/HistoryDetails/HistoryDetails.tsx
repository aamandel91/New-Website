'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

import { DetailsContainer } from '@shared/Containers'

import HistoryDetailsBody, { useHasTimelineHistory } from './HistoryDetailsBody'

const HistoryDetails = () => {
  const t = useTranslations()
  const hasHistory = useHasTimelineHistory()

  if (!hasHistory) return null

  return (
    <DetailsContainer title={t('pdp.sections.history.name')} id="history">
      <HistoryDetailsBody />
    </DetailsContainer>
  )
}

export default HistoryDetails
