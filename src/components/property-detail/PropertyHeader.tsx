'use client'

import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Stack,
  IconButton,
  Button,
  Grid,
  Divider,
  useTheme,
} from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShareIcon from '@mui/icons-material/Share'
import BedIcon from '@mui/icons-material/Bed'
import BathtubIcon from '@mui/icons-material/Bathtub'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ScheduleIcon from '@mui/icons-material/Schedule'
import EmailIcon from '@mui/icons-material/Email'

import { type Property } from 'services/API'
import { getPropertyBadges, getDaysOnMarket } from 'utils/propertyBadges'

interface PropertyHeaderProps {
  price: number
  status: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  beds: number
  baths: number
  sqft: number
  yearBuilt?: number
  property?: Property // Full property object for badge generation
  onSave?: () => void
  onShare?: () => void
  onRequestInfo?: () => void
  onScheduleTour?: () => void
  isSaved?: boolean
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  price,
  status,
  address,
  beds,
  baths,
  sqft,
  yearBuilt,
  property,
  onSave,
  onShare,
  onRequestInfo,
  onScheduleTour,
  isSaved = false,
}) => {
  const theme = useTheme()

  // Get dynamic badges if property object is provided
  const badges = property ? getPropertyBadges(property) : []
  const daysOnMarket = property ? getDaysOnMarket(property) : null

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'active' || statusLower === 'a') return 'success'
    if (statusLower === 'pending' || statusLower === 'p') return 'warning'
    return 'default'
  }

  const getStatusLabel = (status: string): string => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'a') return 'Active'
    if (statusLower === 'p') return 'Pending'
    if (statusLower === 's') return 'Sold'
    return status
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <Box>
      <Stack spacing={2}>
        {/* Address and Price Row */}
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            {address.street}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            {address.city}, {address.state} {address.zip}
          </Typography>
        </Box>

        {/* Price and Status Row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography
            variant="h3"
            component="div"
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              color: 'primary.main',
            }}
          >
            {formatPrice(price)}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={getStatusLabel(status)}
              color={getStatusColor(status)}
              sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
            />
            {/* Dynamic Badges */}
            {badges.map((badge, index) => (
              <Chip
                key={index}
                label={badge.label}
                color={badge.color}
                size="medium"
                sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Key Stats - Compact Single Row */}
        <Stack
          direction="row"
          spacing={{ xs: 2, md: 3 }}
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ py: 1 }}
          flexWrap="wrap"
        >
          <Box>
            <Typography variant="h6" fontWeight="bold" component="span">
              {beds}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
              Beds
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight="bold" component="span">
              {baths}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
              Baths
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight="bold" component="span">
              {formatNumber(sqft)}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
              Sq Ft
            </Typography>
          </Box>

          {yearBuilt && (
            <Box>
              <Typography variant="h6" fontWeight="bold" component="span">
                {yearBuilt}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                Built
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider />

        {/* Action Buttons and Icons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ScheduleIcon />}
              onClick={onScheduleTour}
              sx={{ py: 1.5, flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Request a Tour
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<EmailIcon />}
              onClick={onRequestInfo}
              sx={{ py: 1.5, flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Ask a Question
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={onSave}
              aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {isSaved ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <IconButton
              onClick={onShare}
              aria-label="Share property"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ShareIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default PropertyHeader
