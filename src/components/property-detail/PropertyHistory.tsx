'use client'

import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Home as HomeIcon,
  Update as UpdateIcon,
} from '@mui/icons-material'

interface PriceChange {
  date: string
  price: number
  priceChange?: number
  event: 'listed' | 'price_change' | 'status_change' | 'updated'
  status?: string
}

interface PropertyHistoryProps {
  listingDate?: string
  currentPrice?: number
  originalPrice?: number
  priceHistory?: PriceChange[]
  daysOnMarket?: number
  statusHistory?: Array<{
    date: string
    status: string
  }>
}

const PropertyHistory: React.FC<PropertyHistoryProps> = ({
  listingDate,
  currentPrice,
  originalPrice,
  priceHistory = [],
  daysOnMarket,
  statusHistory = [],
}) => {
  // Build timeline from available data
  const buildTimeline = (): PriceChange[] => {
    const timeline: PriceChange[] = []

    // Add listing date as first event
    if (listingDate && originalPrice) {
      timeline.push({
        date: listingDate,
        price: originalPrice,
        event: 'listed',
        status: 'Active',
      })
    }

    // Add price history if available
    if (priceHistory.length > 0) {
      timeline.push(...priceHistory)
    } else if (originalPrice && currentPrice && originalPrice !== currentPrice) {
      // If no detailed history but prices differ, add a single price change
      timeline.push({
        date: new Date().toISOString(),
        price: currentPrice,
        priceChange: currentPrice - originalPrice,
        event: 'price_change',
      })
    }

    // Add status history
    statusHistory.forEach((status) => {
      timeline.push({
        date: status.date,
        price: currentPrice || 0,
        event: 'status_change',
        status: status.status,
      })
    })

    // Sort by date (newest first)
    return timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  const timeline = buildTimeline()

  // If no history data available, show simple summary
  if (timeline.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Property History
        </Typography>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {listingDate ? (
              <>
                Listed on {new Date(listingDate).toLocaleDateString()}
                {daysOnMarket && ` • ${daysOnMarket} days on market`}
              </>
            ) : (
              'No history information available'
            )}
          </Typography>
        </Box>
      </Paper>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'listed':
        return <HomeIcon />
      case 'price_change':
        return <TrendingDownIcon />
      case 'status_change':
        return <UpdateIcon />
      default:
        return <UpdateIcon />
    }
  }

  const getEventColor = (event: string, priceChange?: number) => {
    if (event === 'listed') return 'primary'
    if (event === 'price_change') {
      return priceChange && priceChange < 0 ? 'success' : 'warning'
    }
    return 'default'
  }

  const getEventTitle = (item: PriceChange) => {
    switch (item.event) {
      case 'listed':
        return 'Listed for Sale'
      case 'price_change':
        return item.priceChange && item.priceChange < 0
          ? 'Price Reduced'
          : 'Price Increased'
      case 'status_change':
        return `Status changed to ${item.status}`
      default:
        return 'Updated'
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Property History
      </Typography>

      {daysOnMarket && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Days on Market: <strong>{daysOnMarket}</strong>
          </Typography>
        </Box>
      )}

      <Timeline position="right">
        {timeline.map((item, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent
              sx={{ py: 1.5, px: 2, flex: 0.3 }}
              color="text.secondary"
            >
              <Typography variant="caption">{formatDate(item.date)}</Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={getEventColor(item.event, item.priceChange)}>
                {getEventIcon(item.event)}
              </TimelineDot>
              {index < timeline.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="subtitle2">{getEventTitle(item)}</Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {formatPrice(item.price)}
              </Typography>
              {item.priceChange && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  {item.priceChange < 0 ? (
                    <TrendingDownIcon fontSize="small" color="success" />
                  ) : (
                    <TrendingUpIcon fontSize="small" color="warning" />
                  )}
                  <Typography
                    variant="body2"
                    color={item.priceChange < 0 ? 'success.main' : 'warning.main'}
                  >
                    {item.priceChange > 0 ? '+' : ''}
                    {formatPrice(Math.abs(item.priceChange))}
                  </Typography>
                </Box>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Paper>
  )
}

export default PropertyHistory
