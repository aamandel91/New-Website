import React from 'react'
import { useTranslations } from 'next-intl'

import { Box, Divider, Stack, Typography } from '@mui/material'

import { DetailsContainer } from '@shared/Containers'

import { useProperty } from 'providers/PropertyProvider'
import { formatDate } from 'utils/formatters'
import { joinNonEmpty } from 'utils/strings'

/**
 * Bottom-of-page MLS attribution + IDX disclosure block. Required by MLS rules.
 * The disclosure copy is a generic BeachesMLS / SE Florida MLS default that
 * Andy can refine; the dynamic listing attribution rows hide when empty.
 */
const MlsDisclaimer = () => {
  const { property } = useProperty()
  const t = useTranslations()

  const brokerage = property.office?.brokerageName
  const mlsNumber = property.mlsNumber
  const sourceMls =
    property.raw?.SourceSystemName ||
    property.raw?.OriginatingSystemName ||
    property.raw?.MlsName

  const contentUpdated = formatDate(property.updatedOn, { utc: true })
  const listingUpdated = property.raw?.ModificationTimestamp
    ? formatDate(property.raw.ModificationTimestamp, { utc: true })
    : contentUpdated

  const rows = [
    brokerage
      ? { label: t('pdp.mlsDisclaimer.offeredBy'), value: brokerage }
      : null,
    mlsNumber
      ? { label: t('pdp.mlsDisclaimer.listingId'), value: mlsNumber }
      : null,
    sourceMls
      ? { label: t('pdp.mlsDisclaimer.source'), value: sourceMls }
      : null,
    contentUpdated
      ? { label: t('pdp.mlsDisclaimer.contentUpdated'), value: contentUpdated }
      : null,
    listingUpdated
      ? { label: t('pdp.mlsDisclaimer.listingUpdated'), value: listingUpdated }
      : null
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <DetailsContainer id="mls-disclaimer">
      <Stack spacing={2}>
        {rows.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              columnGap: 4,
              rowGap: 0.5
            }}
          >
            {rows.map((row) => (
              <Typography
                key={row.label}
                variant="caption"
                color="text.secondary"
              >
                <strong>{row.label}:</strong>{' '}
                {joinNonEmpty([row.value], ' ')}
              </Typography>
            ))}
          </Box>
        )}

        <Divider />

        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {/* Equal Housing Opportunity mark (public-domain style house glyph). */}
          <Box
            aria-label={t('pdp.mlsDisclaimer.equalHousing')}
            sx={{ flexShrink: 0, mt: '2px' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              role="img"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M12 3 2 11h3v8h5v-5h4v5h5v-8h3L12 3Zm0 2.7 5 4V17h-1v-5H8v5H7v-7.3l5-4Z"
              />
            </svg>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t('pdp.mlsDisclaimer.disclosure')}
          </Typography>
        </Stack>
      </Stack>
    </DetailsContainer>
  )
}

export default MlsDisclaimer
