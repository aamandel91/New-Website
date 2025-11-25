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
  onSave,
  onShare,
  onRequestInfo,
  onScheduleTour,
  isSaved = false,
}) => {
  const theme = useTheme()

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
    <Box sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Status Badge and Actions */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
          />

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

        {/* Price */}
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            color: theme.palette.mode === 'dark' ? 'primary.main' : 'text.primary',
          }}
        >
          {formatPrice(price)}
        </Typography>

        {/* Address */}
        <Typography
          variant="h6"
          component="h2"
          color="text.secondary"
          sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
        >
          {address.street}, {address.city}, {address.state} {address.zip}
        </Typography>

        <Divider />

        {/* Key Stats Row */}
        <Grid container spacing={{ xs: 2, md: 4 }} sx={{ py: 2 }}>
          <Grid item xs={6} sm={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <BedIcon color="action" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {beds}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Beds
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <BathtubIcon color="action" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {baths}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Baths
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SquareFootIcon color="action" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {formatNumber(sqft)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sq Ft
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {yearBuilt && (
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon color="action" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {yearBuilt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Built
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          )}
        </Grid>

        <Divider />

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ pt: 2 }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<ScheduleIcon />}
            onClick={onScheduleTour}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Schedule Tour
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<EmailIcon />}
            onClick={onRequestInfo}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Request Info
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default PropertyHeader
