'use client'

import React from 'react'

import BathtubIcon from '@mui/icons-material/Bathtub'
import BedIcon from '@mui/icons-material/Bed'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import SendIcon from '@mui/icons-material/Send'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import type { Property } from 'services/API'
import { getCDNPath } from 'utils/urls'

interface SinglePropertyPageProps {
  property: Property
}

const SinglePropertyPage: React.FC<SinglePropertyPageProps> = ({
  property
}) => {
  const address = {
    street:
      `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}`.trim(),
    city: property.address?.city || '',
    state: property.address?.state || '',
    zip: property.address?.zip || ''
  }

  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`

  const price = property.listPrice ? parseFloat(property.listPrice) : 0
  const beds = property.details?.numBedrooms
    ? parseInt(property.details.numBedrooms)
    : 0
  const baths = property.details?.numBathrooms
    ? parseInt(property.details.numBathrooms)
    : 0
  const sqft = property.details?.sqft ? parseFloat(property.details.sqft) : 0
  const yearBuilt = property.details?.yearBuilt
    ? parseInt(property.details.yearBuilt)
    : undefined
  const description = property.details?.description || ''
  const virtualTourUrl = property.details?.virtualTourUrl
  const images = property.images || []

  const agent =
    property.agents && property.agents.length > 0
      ? {
          name: property.agents[0].name || undefined,
          phone:
            property.agents[0].phones && property.agents[0].phones.length > 0
              ? String(property.agents[0].phones[0])
              : undefined,
          photo:
            property.agents[0].photo?.large || property.agents[0].photo?.small,
          brokerage: property.agents[0].brokerage?.name
        }
      : undefined

  const formatPrice = (val: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val)

  const formatNumber = (num: number): string =>
    new Intl.NumberFormat('en-US').format(num)

  const scrollToContact = () => {
    document
      .getElementById('property-site-contact')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  // Build features list from property details
  const featuresList: string[] = []
  const d = property.details
  if (d) {
    if (d.propertyType) featuresList.push(d.propertyType)
    if (d.style) featuresList.push(d.style)
    if (d.heating) featuresList.push(`Heating: ${d.heating}`)
    if (d.airConditioning) featuresList.push(`A/C: ${d.airConditioning}`)
    if (d.basement1) featuresList.push(`Basement: ${d.basement1}`)
    if (d.driveway) featuresList.push(`Driveway: ${d.driveway}`)
    if (d.garage) featuresList.push(`Garage: ${d.garage}`)
    if (d.numGarageSpaces && d.numGarageSpaces !== '0')
      featuresList.push(`Garage Spaces: ${d.numGarageSpaces}`)
    if (d.numParkingSpaces && d.numParkingSpaces !== '0')
      featuresList.push(`Parking Spaces: ${d.numParkingSpaces}`)
    if (d.numFireplaces && d.numFireplaces !== '0')
      featuresList.push(`Fireplaces: ${d.numFireplaces}`)
    if (d.swimmingPool && d.swimmingPool !== 'None')
      featuresList.push(`Pool: ${d.swimmingPool}`)
    if (d.exteriorConstruction1)
      featuresList.push(`Exterior: ${d.exteriorConstruction1}`)
    if (d.flooringType) featuresList.push(`Flooring: ${d.flooringType}`)
    if (d.foundationType) featuresList.push(`Foundation: ${d.foundationType}`)
    if (d.waterSource) featuresList.push(`Water: ${d.waterSource}`)
    if (d.sewer) featuresList.push(`Sewer: ${d.sewer}`)
  }
  if (property.lot?.acres) featuresList.push(`Lot: ${property.lot.acres} acres`)

  const heroImage = images.length > 0 ? getCDNPath(images[0], 'large') : ''

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '50vh', md: '70vh' },
          overflow: 'hidden',
          bgcolor: 'grey.900'
        }}
      >
        {heroImage && (
          <Box
            component="img"
            src={heroImage}
            alt={fullAddress}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            p: { xs: 3, md: 5 },
            color: '#fff'
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.5rem', md: '2.5rem' }, mb: 0.5 }}
            >
              {address.street}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                opacity: 0.9,
                mb: 1
              }}
            >
              {address.city}, {address.state} {address.zip}
            </Typography>
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
            >
              {formatPrice(price)}
            </Typography>
          </Container>
        </Box>
      </Box>

      {/* Key Stats Bar */}
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: 2 }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={{ xs: 2, md: 4 }}
            justifyContent="center"
            flexWrap="wrap"
            divider={
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
              />
            }
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <BedIcon fontSize="small" />
              <Typography fontWeight="bold">{beds}</Typography>
              <Typography variant="body2">Beds</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <BathtubIcon fontSize="small" />
              <Typography fontWeight="bold">{baths}</Typography>
              <Typography variant="body2">Baths</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <SquareFootIcon fontSize="small" />
              <Typography fontWeight="bold">{formatNumber(sqft)}</Typography>
              <Typography variant="body2">Sq Ft</Typography>
            </Stack>
            {yearBuilt && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <CalendarTodayIcon fontSize="small" />
                <Typography fontWeight="bold">{yearBuilt}</Typography>
                <Typography variant="body2">Built</Typography>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>

      {/* CTA Bar */}
      <Box sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={scrollToContact}
              sx={{ textTransform: 'none', fontWeight: 600, px: 4 }}
            >
              Schedule a Showing
            </Button>
            {virtualTourUrl && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayCircleOutlineIcon />}
                href={virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textTransform: 'none', fontWeight: 600, px: 4 }}
              >
                Virtual Tour
              </Button>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Description Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {description && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              About This Property
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                color: 'text.secondary',
                maxWidth: 800
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

        {/* Photo Grid */}
        {images.length > 1 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Photo Gallery
            </Typography>
            <Grid container spacing={1}>
              {images.map((img, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    component="img"
                    src={getCDNPath(img, 'small')}
                    alt={`${fullAddress} - Photo ${index + 1}`}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: 240,
                      objectFit: 'cover',
                      borderRadius: 1,
                      display: 'block'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Features */}
        {featuresList.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Property Features
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {featuresList.map((feature, index) => (
                <Chip key={index} label={feature} variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Extras */}
        {property.details?.extras && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Additional Details
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              {property.details.extras}
            </Typography>
          </Box>
        )}

        {/* Map Placeholder */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Location
          </Typography>
          <Paper
            elevation={0}
            sx={{
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 2
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <LocationOnIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {fullAddress}
              </Typography>
            </Stack>
          </Paper>
        </Box>

        {/* Contact Form */}
        <Box id="property-site-contact" sx={{ mb: 6, scrollMarginTop: 32 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Schedule a Showing
          </Typography>
          <Paper elevation={2} sx={{ p: { xs: 3, md: 4 }, maxWidth: 600 }}>
            <Stack spacing={2}>
              <TextField label="Full Name" required fullWidth size="small" />
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                size="small"
              />
              <TextField label="Phone" type="tel" fullWidth size="small" />
              <TextField
                label="Message"
                multiline
                rows={3}
                fullWidth
                size="small"
                defaultValue={`I'm interested in ${fullAddress}`}
              />
              <Button
                variant="contained"
                size="large"
                endIcon={<SendIcon />}
                sx={{ py: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                Send Message
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* Agent Branding */}
        {agent && (
          <Box sx={{ py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={agent.photo}
                alt={agent.name}
                sx={{ width: 64, height: 64 }}
              >
                {agent.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {agent.name || 'Listing Agent'}
                </Typography>
                {agent.brokerage && (
                  <Typography variant="body2" color="text.secondary">
                    {agent.brokerage}
                  </Typography>
                )}
                {agent.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {agent.phone}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}

        {/* Brokerage Attribution */}
        {property.office?.brokerageName && (
          <Box sx={{ py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Listed by {property.office.brokerageName}
              {property.mlsNumber && ` | MLS# ${property.mlsNumber}`}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default SinglePropertyPage
