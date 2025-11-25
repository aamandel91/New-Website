'use client'

import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Chip,
  Divider,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'

interface MarketStats {
  averagePrice?: number
  medianPrice?: number
  averageDaysOnMarket?: number
  totalActiveListings?: number
  pricePerSqft?: number
  monthOverMonthChange?: number // Percentage
  yearOverYearChange?: number // Percentage
  inventoryMonths?: number
}

interface PropertyMarketStatsProps {
  neighborhood?: string
  city?: string
  state?: string
  stats?: MarketStats
}

const PropertyMarketStats: React.FC<PropertyMarketStatsProps> = ({
  neighborhood,
  city,
  state,
  stats,
}) => {
  const location = neighborhood || `${city}, ${state}` || 'this area'

  // Default stats if none provided
  const defaultStats: MarketStats = {
    averagePrice: undefined,
    medianPrice: undefined,
    averageDaysOnMarket: undefined,
    totalActiveListings: undefined,
    pricePerSqft: undefined,
    monthOverMonthChange: undefined,
    yearOverYearChange: undefined,
    inventoryMonths: undefined,
  }

  const marketStats = { ...defaultStats, ...stats }

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPercent = (percent: number | undefined) => {
    if (percent === undefined) return null
    const isPositive = percent > 0
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        {isPositive ? (
          <TrendingUpIcon fontSize="small" color="success" />
        ) : (
          <TrendingDownIcon fontSize="small" color="error" />
        )}
        <Typography
          variant="body2"
          color={isPositive ? 'success.main' : 'error.main'}
          fontWeight="bold"
        >
          {isPositive ? '+' : ''}
          {percent.toFixed(1)}%
        </Typography>
      </Stack>
    )
  }

  // If no stats provided, show placeholder
  const hasStats = Object.values(marketStats).some((val) => val !== undefined)

  if (!hasStats) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Market Statistics for {location}
        </Typography>
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Market data is not currently available for this area.
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Market Statistics for {location}</Typography>
        <Chip label="Last 30 days" size="small" />
      </Stack>

      <Grid container spacing={3}>
        {/* Average Price */}
        {marketStats.averagePrice && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MoneyIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Average Price
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {formatPrice(marketStats.averagePrice)}
                </Typography>
                {formatPercent(marketStats.monthOverMonthChange)}
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Median Price */}
        {marketStats.medianPrice && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MoneyIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Median Price
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {formatPrice(marketStats.medianPrice)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Average Days on Market */}
        {marketStats.averageDaysOnMarket && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Avg Days on Market
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {marketStats.averageDaysOnMarket}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  days
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Total Active Listings */}
        {marketStats.totalActiveListings && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HomeIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Active Listings
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {marketStats.totalActiveListings.toLocaleString()}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Price per Sq Ft */}
        {marketStats.pricePerSqft && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MoneyIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Price per Sq Ft
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {formatPrice(marketStats.pricePerSqft)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Inventory Months */}
        {marketStats.inventoryMonths && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Months of Inventory
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {marketStats.inventoryMonths.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {marketStats.inventoryMonths < 5
                    ? "Seller's market"
                    : marketStats.inventoryMonths > 7
                    ? "Buyer's market"
                    : 'Balanced market'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Year over Year Change */}
      {marketStats.yearOverYearChange !== undefined && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Year-over-year change
            </Typography>
            {formatPercent(marketStats.yearOverYearChange)}
          </Stack>
        </>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        * Market statistics are estimates based on recent sales and active listings in the area.
      </Typography>
    </Paper>
  )
}

export default PropertyMarketStats
