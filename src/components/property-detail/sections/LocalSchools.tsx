'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Rating,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'

import useSnackbar from 'hooks/useSnackbar'
import { fetchAreaSchools, type AreaSchool } from './areaDataFetch'

interface LocalSchoolsProps {
  coordinates?: { lat: number; lng: number }
  /** Pre-fetched server data; when provided we skip the client fetch. */
  initialData?: AreaSchool[] | null
  /** Title override; defaults to "Local Schools". */
  title?: string
}

const DEFAULT_VISIBLE = 5

const LocalSchools: React.FC<LocalSchoolsProps> = ({
  coordinates,
  initialData,
  title = 'Local Schools',
}) => {
  const { showSnackbar } = useSnackbar()
  const [data, setData] = useState<AreaSchool[] | null>(initialData ?? null)
  const [loading, setLoading] = useState(initialData === undefined)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (initialData !== undefined) return
    if (!coordinates?.lat || !coordinates?.lng) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAreaSchools(coordinates.lat, coordinates.lng)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
        showSnackbar('Unable to load nearby schools', 'error')
      })
    return () => {
      cancelled = true
    }
  }, [coordinates?.lat, coordinates?.lng, initialData, showSnackbar])

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }, [data])

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" height={68} />
          ))}
        </Stack>
      </Paper>
    )
  }

  if (!sorted.length) return null

  const visible = expanded ? sorted : sorted.slice(0, DEFAULT_VISIBLE)

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <SchoolIcon color="primary" />
        <Typography variant="h6" component="h3" fontWeight="bold">
          {title}
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        {visible.map((school, idx) => (
          <Grid item xs={12} key={`${school.name}-${idx}`}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    component="div"
                    noWrap
                  >
                    {school.name}
                  </Typography>
                  {school.level && (
                    <Chip
                      label={school.level}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  )}
                </Stack>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ mt: 0.5 }}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  {school.distance && (
                    <Typography variant="caption" color="text.secondary">
                      {school.distance} away
                    </Typography>
                  )}
                  {school.stateRank !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      State rank: #{school.stateRank}
                    </Typography>
                  )}
                </Stack>
              </Box>
              {school.rating !== undefined && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rating
                    value={school.rating}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {school.rating.toFixed(1)}
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
      {sorted.length > DEFAULT_VISIBLE && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => setExpanded((v) => !v)}
            sx={{ textTransform: 'none' }}
          >
            {expanded
              ? 'Show fewer schools'
              : `Show all ${sorted.length} schools`}
          </Button>
        </Box>
      )}
    </Paper>
  )
}

export default LocalSchools
