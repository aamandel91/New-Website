'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Chip,
  Divider,
  Collapse,
  Button,
  Skeleton,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material'

const MarketTimelineGraph = dynamic(() => import('@shared/MarketTimelineGraph'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

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
  listToSaleRatio?: number
}

const PropertyMarketStats: React.FC<PropertyMarketStatsProps> = ({
  neighborhood,
  city,
  state,
  stats,
  listToSaleRatio,
}) => {
  const [showExplanation, setShowExplanation] = useState(false)
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: isPositive ? 'success.light' : 'error.light',
          }}
        >
          {isPositive ? (
            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.dark' }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 16, color: 'error.dark' }} />
          )}
        </Box>
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

  // Market condition helpers
  const getMarketCondition = (months: number | undefined) => {
    if (months === undefined) return null
    if (months < 4) return { label: "Seller's Market", color: '#ef5350', position: 15 }
    if (months <= 6) return { label: 'Balanced Market', color: '#ff9800', position: 50 }
    return { label: "Buyer's Market", color: '#42a5f5', position: 85 }
  }

  const marketCondition = getMarketCondition(marketStats.inventoryMonths)

  // If no stats provided, show placeholder
  const hasStats = Object.values(marketStats).some((val) => val !== undefined) || listToSaleRatio !== undefined

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

      {/* Market Condition Indicator */}
      {marketCondition && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Market Condition
            </Typography>
            <Chip
              label={marketCondition.label}
              size="small"
              sx={{
                bgcolor: marketCondition.color,
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            />
          </Stack>
          <Box sx={{ position: 'relative', height: 12, borderRadius: 6, overflow: 'hidden' }}>
            {/* Gradient bar */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #ef5350, #ff9800 50%, #42a5f5)',
                borderRadius: 6,
              }}
            />
            {/* Indicator dot */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: `${marketCondition.position}%`,
                transform: 'translate(-50%, -50%)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: '#fff',
                border: `3px solid ${marketCondition.color}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                zIndex: 1,
              }}
            />
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Seller&apos;s Market</Typography>
            <Typography variant="caption" color="text.secondary">Balanced</Typography>
            <Typography variant="caption" color="text.secondary">Buyer&apos;s Market</Typography>
          </Stack>
        </Box>
      )}

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

        {/* List-to-Sale Price Ratio */}
        {listToSaleRatio !== undefined && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BarChartIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    List-to-Sale Ratio
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold">
                  {listToSaleRatio.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {listToSaleRatio >= 100
                    ? 'Homes selling at or above asking'
                    : listToSaleRatio >= 97
                    ? 'Homes selling close to asking'
                    : 'Homes selling below asking price'}
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
                  {marketStats.inventoryMonths < 4
                    ? "Seller's market"
                    : marketStats.inventoryMonths > 6
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

      {/* What does this mean? */}
      <Divider sx={{ my: 2 }} />
      <Button
        onClick={() => setShowExplanation(!showExplanation)}
        endIcon={showExplanation ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ textTransform: 'none', color: 'text.secondary', p: 0 }}
        size="small"
      >
        What does this mean?
      </Button>
      <Collapse in={showExplanation}>
        <Box sx={{ mt: 1.5, pl: 1, borderLeft: '3px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>For Buyers:</strong> In a buyer&apos;s market (high inventory), you have more negotiating
            power and can take your time. In a seller&apos;s market (low inventory), expect competition
            and be prepared to act quickly with strong offers.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>For Sellers:</strong> In a seller&apos;s market, you can price more aggressively and
            expect multiple offers. In a buyer&apos;s market, competitive pricing and home preparation
            become more important to attract buyers.
          </Typography>
        </Box>
      </Collapse>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        * Market statistics are estimates based on recent sales and active listings in the area.
      </Typography>

      {/* Market Timeline Graph */}
      {city && (
        <Box sx={{ mt: 3 }}>
          <MarketTimelineGraph city={city} />
        </Box>
      )}
    </Paper>
  )
}

export default PropertyMarketStats
