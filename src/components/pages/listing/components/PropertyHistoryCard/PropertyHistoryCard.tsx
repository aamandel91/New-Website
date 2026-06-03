'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'

import PropertyTransactionHistoryBody from '@/components/property-detail/PropertyTransactionHistoryBody'
import { DetailsContainer } from '@shared/Containers'

import type { HistoryItemType } from 'services/API'

import { HistoryDetailsBody, useHasTimelineHistory } from '../HistoryDetails'

type HistoryView = 'timeline' | 'transactions'

interface PropertyHistoryCardProps {
  transactionHistory?: HistoryItemType[]
}

const PropertyHistoryCard: React.FC<PropertyHistoryCardProps> = ({
  transactionHistory
}) => {
  const t = useTranslations()
  const hasTimeline = useHasTimelineHistory()
  const hasTransactions = Boolean(
    transactionHistory && transactionHistory.length > 0
  )

  const [view, setView] = useState<HistoryView>(
    hasTimeline ? 'timeline' : 'transactions'
  )

  if (!hasTimeline && !hasTransactions) return null

  const showToggle = hasTimeline && hasTransactions
  const activeView: HistoryView = showToggle
    ? view
    : hasTimeline
      ? 'timeline'
      : 'transactions'

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    next: HistoryView | null
  ) => {
    if (next) setView(next)
  }

  return (
    <DetailsContainer title={t('pdp.sections.history.name')} id="history">
      <Stack spacing={3}>
        {showToggle && (
          <ToggleButtonGroup
            value={activeView}
            exclusive
            onChange={handleChange}
            size="small"
            color="primary"
            aria-label={t('pdp.sections.history.name')}
          >
            <ToggleButton value="timeline">
              {t('pdp.sections.history.tabs.timeline')}
            </ToggleButton>
            <ToggleButton value="transactions">
              {t('pdp.sections.history.tabs.transactions')}
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        {activeView === 'timeline' ? (
          <HistoryDetailsBody />
        ) : (
          <PropertyTransactionHistoryBody history={transactionHistory ?? []} />
        )}
      </Stack>
    </DetailsContainer>
  )
}

export default PropertyHistoryCard
