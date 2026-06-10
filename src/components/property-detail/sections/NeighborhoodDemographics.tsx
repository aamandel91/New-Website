'use client'

import React, { useEffect, useState } from 'react'

import CakeIcon from '@mui/icons-material/Cake'
import GroupsIcon from '@mui/icons-material/Groups'
import HouseIcon from '@mui/icons-material/House'
import PaidIcon from '@mui/icons-material/Paid'
import { Box, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material'

import useSnackbar from 'hooks/useSnackbar'

import { type AreaDemographics, fetchAreaDemographics } from './areaDataFetch'

interface NeighborhoodDemographicsProps {
  cityName?: string
  coordinates?: { lat: number; lng: number }
  /** Pre-fetched server data; when provided we skip the client fetch. */
  initialData?: AreaDemographics | null
}

function formatCurrency(value?: number): string {
  if (value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

function formatNumber(value?: number): string {
  if (value === undefined) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </Stack>
    </Paper>
  )
}

const NeighborhoodDemographics: React.FC<NeighborhoodDemographicsProps> = ({
  cityName,
  coordinates,
  initialData
}) => {
  const { showSnackbar } = useSnackbar()
  const [data, setData] = useState<AreaDemographics | null>(initialData ?? null)
  const [loading, setLoading] = useState(initialData === undefined)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    if (initialData !== undefined) return
    if (!coordinates?.lat || !coordinates?.lng) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAreaDemographics(coordinates.lat, coordinates.lng)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setErrored(true)
        setLoading(false)
        showSnackbar('Unable to load neighborhood data', 'error')
      })
    return () => {
      cancelled = true
    }
  }, [coordinates?.lat, coordinates?.lng, initialData, showSnackbar])

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Skeleton variant="text" width={240} height={32} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} item xs={6} md={3}>
              <Skeleton variant="rectangular" height={88} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    )
  }

  if (errored || !data) return null

  const label = cityName || 'this area'

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
        About the People of {label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Demographic snapshot of households living in {label}.
      </Typography>
      <Grid container spacing={2}>
        {data.population !== undefined && (
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<GroupsIcon color="action" fontSize="small" />}
              label="Population"
              value={formatNumber(data.population)}
            />
          </Grid>
        )}
        {data.medianIncome !== undefined && (
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<PaidIcon color="action" fontSize="small" />}
              label="Median Household Income"
              value={formatCurrency(data.medianIncome)}
            />
          </Grid>
        )}
        {data.medianAge !== undefined && (
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<CakeIcon color="action" fontSize="small" />}
              label="Median Age"
              value={`${Math.round(data.medianAge)} yrs`}
            />
          </Grid>
        )}
        {data.households !== undefined && (
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<HouseIcon color="action" fontSize="small" />}
              label="Households"
              value={formatNumber(data.households)}
            />
          </Grid>
        )}
        {data.ownerOccupiedPct !== undefined && (
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<HouseIcon color="action" fontSize="small" />}
              label="Owner-Occupied"
              value={`${Math.round(data.ownerOccupiedPct)}%`}
            />
          </Grid>
        )}
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Source: Repliers locations data. Figures are estimates and may not
          reflect the most current census release.
        </Typography>
      </Box>
    </Paper>
  )
}

export default NeighborhoodDemographics
