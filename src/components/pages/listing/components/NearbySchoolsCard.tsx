'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import SchoolIcon from '@mui/icons-material/School'
import {
  Box,
  Chip,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'

import { DetailsContainer } from '@shared/Containers'

import { useProperty } from 'providers/PropertyProvider'
import {
  type AreaSchool,
  fetchAreaSchools
} from 'components/property-detail/sections/areaDataFetch'

const MAX_SCHOOLS = 5

/**
 * Nearby schools WITH ratings. Reuses the same `/places` lookup used by the
 * search-filter and the city-page school cards. Renders nothing while loading
 * resolves to an empty list, so a property with no school data hides the card.
 */
const NearbySchoolsCard = () => {
  const { property } = useProperty()
  const t = useTranslations()

  const lat = property.map?.latitude
  const lng = property.map?.longitude

  const [data, setData] = useState<AreaSchool[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAreaSchools(lat, lng)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lat, lng])

  const schools = useMemo(() => {
    if (!data) return []
    return [...data]
      .sort((a, b) => {
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY
        return da - db
      })
      .slice(0, MAX_SCHOOLS)
  }, [data])

  if (loading) {
    return (
      <DetailsContainer title={t('pdp.sections.nearbySchools.name')} id="nearby-schools">
        <Stack spacing={1.5}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" height={56} />
          ))}
        </Stack>
      </DetailsContainer>
    )
  }

  if (!schools.length) return null

  return (
    <DetailsContainer
      title={t('pdp.sections.nearbySchools.name')}
      id="nearby-schools"
    >
      <Stack spacing={2}>
        {schools.map((school, idx) => (
          <Stack
            key={`${school.name}-${idx}`}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default'
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <SchoolIcon color="primary" fontSize="small" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {school.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1.5}
                  flexWrap="wrap"
                  alignItems="center"
                >
                  {school.level && (
                    <Typography variant="caption" color="text.secondary">
                      {school.level}
                    </Typography>
                  )}
                  {school.distance && (
                    <Typography variant="caption" color="text.secondary">
                      {t('pdp.sections.nearbySchools.distance', {
                        distance: school.distance
                      })}
                    </Typography>
                  )}
                  {school.stateRank !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {t('pdp.sections.nearbySchools.stateRank', {
                        rank: school.stateRank
                      })}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>

            {school.rating !== undefined && (
              <Chip
                label={`${school.rating}/10`}
                color="primary"
                size="small"
                sx={{ borderRadius: 1, fontWeight: 700 }}
              />
            )}
          </Stack>
        ))}

        <Typography variant="caption" color="text.secondary">
          {t('pdp.sections.nearbySchools.disclaimer')}
        </Typography>
      </Stack>
    </DetailsContainer>
  )
}

export default NearbySchoolsCard
