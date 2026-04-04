'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import BathtubIcon from '@mui/icons-material/Bathtub'
import BedIcon from '@mui/icons-material/Bed'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EmailIcon from '@mui/icons-material/Email'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import GavelIcon from '@mui/icons-material/Gavel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ScheduleIcon from '@mui/icons-material/Schedule'
import ShareIcon from '@mui/icons-material/Share'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import Link from '@mui/material/Link'

import PropertyValueEstimate from 'components/shared/Property/PropertyValueEstimate'

import { type Property } from 'services/API'
import { getDaysOnMarket, getPropertyBadges } from 'utils/propertyBadges'

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
  isSaved = false
}) => {
  const theme = useTheme()

  // Get dynamic badges if property object is provided
  const badges = property ? getPropertyBadges(property) : []
  const daysOnMarket = property ? getDaysOnMarket(property) : null

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'default' => {
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
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Feature #2: Estimated monthly payment calculation
  const calculateMonthlyPayment = (): string | null => {
    if (!price || price <= 0) return null
    const downPayment = price * 0.2
    const loanAmount = price - downPayment
    const monthlyRate = 0.065 / 12
    const numPayments = 30 * 12
    const monthlyPI =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    const monthlyTax = (property?.taxes?.annualAmount ?? 0) / 12
    const totalMonthly = monthlyPI + monthlyTax
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(totalMonthly)
  }

  const estimatedMonthly = calculateMonthlyPayment()

  // Feature #5: Open house badge
  const getUpcomingOpenHouse = (): {
    date: string
    startTime: string
    endTime: string
  } | null => {
    if (!property?.openHouse) return null
    const now = new Date()
    const entries = Object.values(property.openHouse) as Array<{
      date: string | null
      startTime: string | null
      endTime: string | null
    }>
    for (const entry of entries) {
      if (!entry?.date) continue
      const ohDate = new Date(entry.date)
      if (isNaN(ohDate.getTime())) continue
      // Consider open house as upcoming if date is today or in the future
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
      if (ohDate >= todayStart) {
        return {
          date: entry.date,
          startTime: entry.startTime ?? '',
          endTime: entry.endTime ?? ''
        }
      }
    }
    return null
  }

  const upcomingOpenHouse = getUpcomingOpenHouse()

  const formatOpenHouseDisplay = (): string | null => {
    if (!upcomingOpenHouse) return null
    const ohDate = new Date(upcomingOpenHouse.date)
    const dayStr = ohDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    const parts = [dayStr]
    if (upcomingOpenHouse.startTime) {
      const formatTime = (t: string) => {
        const d = new Date(`2000-01-01T${t}`)
        return isNaN(d.getTime())
          ? t
          : d.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })
      }
      const start = formatTime(upcomingOpenHouse.startTime)
      if (upcomingOpenHouse.endTime) {
        const end = formatTime(upcomingOpenHouse.endTime)
        parts.push(`${start} \u2013 ${end}`)
      } else {
        parts.push(start)
      }
    }
    return parts.join(' \u00B7 ')
  }

  const openHouseDisplay = formatOpenHouseDisplay()

  // Feature #4: Only show "Start an Offer" for active listings
  const isActiveListing = ['a', 'active'].includes(status.toLowerCase())
  const pathname = usePathname()

  const handleStartOffer = () => {
    const slug = pathname.split('/listing/')[1]
    if (slug) {
      window.location.href = `/listing/${slug}/offer`
    }
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
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            {address.street}, {address.city}, {address.state} {address.zip}
          </Typography>
        </Box>

        {/* Open House Banner */}
        {openHouseDisplay && (
          <Chip
            label={`\uD83C\uDFE0 Open House: ${openHouseDisplay}`}
            sx={{
              alignSelf: 'flex-start',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              bgcolor: '#e8f5e9',
              color: '#2e7d32',
              border: '1px solid #a5d6a7',
              py: 0.5
            }}
          />
        )}

        {/* Price and Status Row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography
              variant="h3"
              component="div"
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                color: 'primary.main'
              }}
            >
              {formatPrice(price)}
            </Typography>
            {estimatedMonthly && (
              <Link
                href="#mortgage-calculator"
                underline="hover"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById('mortgage-calculator')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Est. {estimatedMonthly}/mo
              </Link>
            )}
          </Box>

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

        {/* Value Estimate */}
        {property?.estimate && (
          <Box sx={{ maxWidth: { xs: '100%', md: '400px' } }}>
            <PropertyValueEstimate
              estimate={property.estimate}
              variant="detailed"
            />
          </Box>
        )}

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
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ ml: 0.5 }}
            >
              Beds
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight="bold" component="span">
              {baths}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ ml: 0.5 }}
            >
              Baths
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight="bold" component="span">
              {formatNumber(sqft)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ ml: 0.5 }}
            >
              Sq Ft
            </Typography>
          </Box>

          {yearBuilt && (
            <Box>
              <Typography variant="h6" fontWeight="bold" component="span">
                {yearBuilt}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{ ml: 0.5 }}
              >
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
            {isActiveListing && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<GavelIcon />}
                onClick={handleStartOffer}
                sx={{
                  py: 1.5,
                  flex: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#e65100',
                  borderColor: '#e65100',
                  '&:hover': {
                    borderColor: '#bf360c',
                    bgcolor: 'rgba(230, 81, 0, 0.04)'
                  }
                }}
              >
                Start an Offer
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={onSave}
              aria-label={
                isSaved ? 'Remove from favorites' : 'Add to favorites'
              }
              sx={{
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {isSaved ? (
                <FavoriteIcon color="error" />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
            <IconButton
              onClick={onShare}
              aria-label="Share property"
              sx={{
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ShareIcon />
            </IconButton>
            {property?.mlsNumber && (
              <IconButton
                component="a"
                href={`/property/${property.mlsNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Shareable link"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <OpenInNewIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default PropertyHeader
