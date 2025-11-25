'use client'

import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Link as MuiLink,
  Grid,
  Stack,
  Chip,
} from '@mui/material'
import Link from 'next/link'
import {
  LocationCity as CityIcon,
  Apartment as NeighborhoodIcon,
  Home as PropertyTypeIcon,
  School as SchoolIcon,
  Place as AreaIcon,
} from '@mui/icons-material'

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
  schoolDistrict,
}) => {
  const relatedPages: RelatedPage[] = []

  // Build dynamic links based on available property data
  if (city && state) {
    relatedPages.push({
      title: `Homes for Sale in ${city}, ${state}`,
      url: `/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
      type: 'city',
      icon: <CityIcon />,
    })

    // Add city guide page link (if you have CMS pages for cities)
    relatedPages.push({
      title: `${city} Real Estate Guide`,
      url: `/cities/${city.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'city',
      icon: <CityIcon />,
    })
  }

  if (neighborhood && city && state) {
    relatedPages.push({
      title: `${neighborhood} Neighborhood - ${city}, ${state}`,
      url: `/neighborhood/${neighborhood.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'neighborhood',
      icon: <NeighborhoodIcon />,
    })

    relatedPages.push({
      title: `Homes for Sale in ${neighborhood}`,
      url: `/search?neighborhood=${encodeURIComponent(neighborhood)}&city=${encodeURIComponent(city)}`,
      type: 'neighborhood',
      icon: <NeighborhoodIcon />,
    })
  }

  if (propertyType && city && state) {
    const formattedType = propertyType.toLowerCase()
    relatedPages.push({
      title: `${propertyType}s for Sale in ${city}, ${state}`,
      url: `/search?propertyType=${encodeURIComponent(formattedType)}&city=${encodeURIComponent(city)}`,
      type: 'propertyType',
      icon: <PropertyTypeIcon />,
    })

    // Property type guide page
    relatedPages.push({
      title: `${city} ${propertyType} Buyers Guide`,
      url: `/property-type/${formattedType}?city=${encodeURIComponent(city)}`,
      type: 'propertyType',
      icon: <PropertyTypeIcon />,
    })
  }

  if (zipCode) {
    relatedPages.push({
      title: `${zipCode} Real Estate & Homes for Sale`,
      url: `/zip/${zipCode}`,
      type: 'zipcode',
      icon: <AreaIcon />,
    })
  }

  if (schoolDistrict && city && state) {
    relatedPages.push({
      title: `Homes in ${schoolDistrict} School District`,
      url: `/search?schoolDistrict=${encodeURIComponent(schoolDistrict)}&city=${encodeURIComponent(city)}`,
      type: 'school',
      icon: <SchoolIcon />,
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
        Explore more information about the area, neighborhood, and property types
      </Typography>

      <Grid container spacing={2}>
        {relatedPages.map((page, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Link href={page.url} passHref legacyBehavior>
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
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', pt: 0.5 }}>
                  {page.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="text.primary"
                    sx={{
                      '&:hover': {
                        color: 'primary.main',
                      },
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
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
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
