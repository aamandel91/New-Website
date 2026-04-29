import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import HomeIcon from '@mui/icons-material/Home'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import InventoryIcon from '@mui/icons-material/Inventory2'

import { formatEnglishPrice } from 'utils/formatters'
import { pluralize } from 'utils/strings'

// MarketTrendsChartLazy is a Client Component that internally lazy-loads the
// real chart (which pulls in recharts ~120KB gzipped). This means city /
// neighborhood pages — which include this widget below the fold — don't ship
// recharts in their initial bundle.
import MarketTrendsChart from './MarketTrendsChartLazy'
import { fetchMarketTrends, getMarketCondition } from './utils'

interface MarketTrendsWidgetProps {
  city: string
  state: string
  boardId?: number
  monthsBack?: number
  showDaysOnMarket?: boolean
  title?: string
}

const MarketTrendsWidget: React.FC<MarketTrendsWidgetProps> = async ({
  city,
  state,
  boardId,
  monthsBack = 12,
  showDaysOnMarket = true,
  title = 'Market Trends',
}) => {
  const { chartData, summary } = await fetchMarketTrends(city, state, boardId, monthsBack)

  if (!summary || chartData.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Alert severity="info">
          No market trends data is currently available for {city}, {state}.
        </Alert>
      </Paper>
    )
  }

  const marketCondition = getMarketCondition(summary.inventoryMonths)

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Market statistics and trends for {city}, {state}
        </Typography>
      </Box>

      {/* Summary Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Median Price */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HomeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Median Price
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatEnglishPrice(summary.currentMedianPrice)}
              </Typography>
              {summary.monthOverMonthChange !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    size="small"
                    icon={
                      summary.monthOverMonthChange > 0 ? (
                        <TrendingUpIcon />
                      ) : (
                        <TrendingDownIcon />
                      )
                    }
                    label={`${summary.monthOverMonthChange > 0 ? '+' : ''}${summary.monthOverMonthChange}%`}
                    color={summary.monthOverMonthChange > 0 ? 'success' : 'error'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    vs last month
                  </Typography>
                </Box>
              )}
              {summary.yearOverYearChange !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {summary.yearOverYearChange > 0 ? '+' : ''}
                  {summary.yearOverYearChange}% YoY
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Days on Market */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Avg. Days on Market
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {pluralize(summary.averageDaysOnMarket, { one: '$ day', many: '$ days' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Listings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Active Listings
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {summary.totalActiveListings.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Condition */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Market Condition
                </Typography>
              </Box>
              <Chip
                label={marketCondition.label}
                sx={{
                  bgcolor: marketCondition.color,
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 1,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {summary.inventoryMonths} months of inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart */}
      <Box sx={{ width: '100%', mt: 2 }}>
        <MarketTrendsChart
          data={chartData}
          showDaysOnMarket={showDaysOnMarket}
          height={400}
        />
      </Box>

      {/* Chart Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 20,
              height: 3,
              bgcolor: '#1976d2',
              mr: 1,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Median Price
          </Typography>
        </Box>
        {showDaysOnMarket && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 20,
                height: 3,
                bgcolor: '#f57c00',
                mr: 1,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Days on Market
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer Note */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        * Data reflects the last {monthsBack} months of market activity
      </Typography>
    </Paper>
  )
}

export default MarketTrendsWidget

/**
 * Loading skeleton for MarketTrendsWidget
 */
export const MarketTrendsWidgetSkeleton: React.FC = () => {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={300} height={20} sx={{ mb: 3 }} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card variant="outlined">
              <CardContent>
                <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={100} height={32} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Skeleton variant="rectangular" width="100%" height={400} />
    </Paper>
  )
}
