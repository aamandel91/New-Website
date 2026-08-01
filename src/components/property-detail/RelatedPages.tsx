'use client'

import React from 'react'
import Link from 'next/link'

import NeighborhoodIcon from '@mui/icons-material/Apartment'
import PropertyTypeIcon from '@mui/icons-material/Home'
import CityIcon from '@mui/icons-material/LocationCity'
import AreaIcon from '@mui/icons-material/Place'
import SchoolIcon from '@mui/icons-material/School'
import {
  Box,
  Chip,
  Grid,
  Link as MuiLink,
  Paper,
  Stack,
  Typography
} from '@mui/material'

interface RelatedPage {
  title: string
  url: string
  type: 'city' | 'neighborhood' | 'propertyType' | 'school' | 'zipcode'
  icon: React.ReactNode
}

interface RelatedPagesProps {
  city?: string
  state?: string
  neighborhood?: string
  propertyType?: string
  zipCode?: string
  schoolDistrict?: string
}

const RelatedPages: React.FC<RelatedPagesProps> = ({
  city,
  state,
  neighborhood,
  propertyType,
  zipCode,
  schoolDistrict
}) => {
  const relatedPages: RelatedPage[] = []

  // Build dynamic links based on available property data
  const citySlug = city ? city.toLowerCase().replace(/\s+/g, '-') : ''

  if (city && state) {
    relatedPages.push({
      title: `Homes for Sale in ${city}, ${state}`,
      url: `/${citySlug}`,
      type: 'city',
      icon: <CityIcon />
    })

    relatedPages.push({
      title: `${city} Real Estate Guide`,
      url: `/${citySlug}`,
      type: 'city',
      icon: <CityIcon />
    })
  }

  if (neighborhood && city && state) {
    const neighborhoodSlug = neighborhood.toLowerCase().replace(/\s+/g, '-')
    relatedPages.push({
      title: `${neighborhood} Neighborhood - ${city}, ${state}`,
      url: `/${citySlug}/${neighborhoodSlug}`,
      type: 'neighborhood',
      icon: <NeighborhoodIcon />
    })

    relatedPages.push({
      title: `Homes for Sale in ${neighborhood}`,
      url: `/${citySlug}/${neighborhoodSlug}`,
      type: 'neighborhood',
      icon: <NeighborhoodIcon />
    })
  }

  if (propertyType && city && state) {
    const formattedType = propertyType.toLowerCase()
    relatedPages.push({
      title: `${propertyType}s for Sale in ${city}, ${state}`,
      url: `/search?propertyType=${encodeURIComponent(formattedType)}&city=${encodeURIComponent(city)}`,
      type: 'propertyType',
      icon: <PropertyTypeIcon />
    })

    relatedPages.push({
      title: `${city} ${propertyType} Buyers Guide`,
      url: `/search?propertyType=${encodeURIComponent(formattedType)}&city=${encodeURIComponent(city)}`,
      type: 'propertyType',
      icon: <PropertyTypeIcon />
    })
  }

  if (zipCode && city) {
    relatedPages.push({
      title: `${zipCode} Real Estate & Homes for Sale`,
      url: `/${citySlug}/${zipCode}`,
      type: 'zipcode',
      icon: <AreaIcon />
    })
  } else if (zipCode) {
    relatedPages.push({
      title: `${zipCode} Real Estate & Homes for Sale`,
      url: `/search?zip=${zipCode}`,
      type: 'zipcode',
      icon: <AreaIcon />
    })
  }

  if (schoolDistrict && city && state) {
    relatedPages.push({
      title: `Homes in ${schoolDistrict} School District`,
      url: `/${citySlug}/schools`,
      type: 'school',
      icon: <SchoolIcon />
    })
  }

  if (relatedPages.length === 0) {
    return null
  }

  const cityState = city && state ? `${city}, ${state}` : 'this area'

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* SEO-optimized H3 heading with keywords */}
      <Typography variant="h6" component="h3" gutterBottom>
        Related Pages for {cityState}
        {propertyType && ` ${propertyType}s`}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Explore more information about the area, neighborhood, and property
        types
      </Typography>

      <Grid container spacing={2}>
        {relatedPages.map((page, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Link href={page.url} passHref legacyBehavior prefetch={false}>
              <MuiLink
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ color: 'primary.main', pt: 0.5 }}>{page.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="text.primary"
                    sx={{
                      '&:hover': {
                        color: 'primary.main'
                      }
                    }}
                  >
                    {page.title}
                  </Typography>
                </Box>
              </MuiLink>
            </Link>
          </Grid>
        ))}
      </Grid>

      {/* Additional contextual information */}
      <Box
        sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {city && (
            <Chip
              label={city}
              size="small"
              component={Link}
              href={`/search?city=${encodeURIComponent(city)}`}
              clickable
            />
          )}
          {neighborhood && (
            <Chip
              label={neighborhood}
              size="small"
              component={Link}
              href={`/search?neighborhood=${encodeURIComponent(neighborhood)}`}
              clickable
            />
          )}
          {propertyType && (
            <Chip
              label={propertyType}
              size="small"
              component={Link}
              href={`/search?propertyType=${encodeURIComponent(propertyType.toLowerCase())}`}
              clickable
            />
          )}
        </Stack>
      </Box>
    </Paper>
  )
}

export default RelatedPages
