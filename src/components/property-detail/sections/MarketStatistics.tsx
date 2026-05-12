'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import MoneyIcon from '@mui/icons-material/AttachMoney'
import CalendarIcon from '@mui/icons-material/CalendarToday'
import PercentIcon from '@mui/icons-material/Percent'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { tenant } from '@/configs/tenant.config'
import useSnackbar from 'hooks/useSnackbar'
import {
  fetchAreaMarketStats,
  type AreaMarketStats,
} from './areaDataFetch'

interface MarketStatisticsProps {
  cityName?: string
  /** Pre-fetched server data; when provided we skip the client fetch. */
  initialData?: AreaMarketStats | null
}

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

function formatMonthLabel(ym: string): string {
  // expects "YYYY-MM"
  const [y, m] = ym.split('-')
  if (!y || !m) return ym
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
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
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

const MarketStatistics: React.FC<MarketStatisticsProps> = ({
  cityName,
  initialData,
}) => {
  const { showSnackbar } = useSnackbar()
  const [data, setData] = useState<AreaMarketStats | null>(initialData ?? null)
  const [loading, setLoading] = useState(initialData === undefined)
  const primaryColor = tenant.visualIdentity?.colors?.primary || '#1976d2'

  useEffect(() => {
    if (initialData !== undefined) return
    if (!cityName) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAreaMarketStats(cityName)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
        showSnackbar('Unable to load market statistics', 'error')
      })
    return () => {
      cancelled = true
    }
  }, [cityName, initialData, showSnackbar])

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Skeleton variant="text" width={260} height={32} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} item xs={6} md={3}>
              <Skeleton variant="rectangular" height={104} />
            </Grid>
          ))}
        </Grid>
        <Skeleton
          variant="rectangular"
          height={240}
          sx={{ mt: 2, borderRadius: 1 }}
        />
      </Paper>
    )
  }

  if (!data) return null

  const trendData =
    data.trend?.map((d) => ({
      label: formatMonthLabel(d.month),
      medianPrice: d.medianPrice,
    })) ?? []

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
        Market Statistics for {cityName || 'this area'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Recent and active inventory pulled from the local MLS feed.
      </Typography>

      <Grid container spacing={2}>
        {data.activeCount !== undefined && (
          <Grid item xs={6} md={3}>
            <KpiCard
              icon={<HomeIcon color="action" fontSize="small" />}
              label="Active Listings"
              value={data.activeCount.toLocaleString()}
            />
          </Grid>
        )}
        {data.medianPrice !== undefined && (
          <Grid item xs={6} md={3}>
            <KpiCard
              icon={<MoneyIcon color="action" fontSize="small" />}
              label="Median Price"
              value={formatCurrency(data.medianPrice)}
            />
          </Grid>
        )}
        {data.averageDaysOnMarket !== undefined && (
          <Grid item xs={6} md={3}>
            <KpiCard
              icon={<CalendarIcon color="action" fontSize="small" />}
              label="Avg Days on Market"
              value={`${Math.round(data.averageDaysOnMarket)}`}
              hint="days"
            />
          </Grid>
        )}
        {data.saleToListRatio !== undefined && (
          <Grid item xs={6} md={3}>
            <KpiCard
              icon={<PercentIcon color="action" fontSize="small" />}
              label="Sale-to-List Ratio"
              value={`${data.saleToListRatio.toFixed(1)}%`}
              hint={
                data.saleToListRatio >= 100
                  ? 'Homes selling at or above asking'
                  : data.saleToListRatio >= 97
                    ? 'Close to asking'
                    : 'Below asking price'
              }
            />
          </Grid>
        )}
      </Grid>

      {trendData.length >= 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            12-Month Median Sold Price Trend
          </Typography>
          <Box sx={{ height: 220, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="label"
                  stroke="#999"
                  fontSize={11}
                  tickMargin={6}
                />
                <YAxis
                  stroke="#999"
                  fontSize={11}
                  tickFormatter={formatCurrencyShort}
                  width={60}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="medianPrice"
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: primaryColor }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2 }}
      >
        Source: Repliers MLS aggregates. Updated continuously as new listings
        come online.
      </Typography>
    </Paper>
  )
}

export default MarketStatistics
