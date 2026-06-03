import React from 'react'
import { useTranslations } from 'next-intl'

import { Stack, Typography } from '@mui/material'

import { useProperty } from 'providers/PropertyProvider'
import { joinNonEmpty } from 'utils/strings'

/**
 * Small MLS-source attribution shown directly beneath the listing description.
 * Hides entirely when neither the source MLS name nor the brokerage is known.
 */
const MlsSourceAttribution = () => {
  const { property } = useProperty()
  const t = useTranslations()

  const sourceMls =
    property.raw?.SourceSystemName ||
    property.raw?.OriginatingSystemName ||
    property.raw?.MlsName
  const brokerage = property.office?.brokerageName

  const line = joinNonEmpty(
    [
      sourceMls ? `${t('pdp.mlsSource.source')}: ${sourceMls}` : '',
      brokerage ? `${t('pdp.mlsSource.brokerage')}: ${brokerage}` : ''
    ],
    ' · '
  )

  if (!line) return null

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {line}
      </Typography>
    </Stack>
  )
}

export default MlsSourceAttribution
