'use client'

import React from 'react'

import LocationCityIcon from '@mui/icons-material/LocationCity'
import { Box, Link, Paper, Typography } from '@mui/material'

interface PropertyNeighborhoodProps {
  neighborhood?: string
  city?: string
  state?: string
  zip?: string
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-')
}

const PropertyNeighborhood: React.FC<PropertyNeighborhoodProps> = ({
  neighborhood,
  city,
  state,
  zip
}) => {
  if (!neighborhood) return null

  const neighborhoodSlug = slugify(neighborhood)
  const cityStateSlug =
    city && state ? `${slugify(city)}-${slugify(state)}` : ''

  const paragraph = [
    `${neighborhood} is a neighborhood`,
    city ? ` in ${city}` : '',
    state ? `, ${state}` : '',
    zip ? ` ${zip}` : '',
    '. ',
    city
      ? `Residents of ${neighborhood} enjoy the amenities and lifestyle that ${city} has to offer. `
      : '',
    `Explore available listings in ${neighborhood} to find your next home.`
  ].join('')

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: 'grey.50',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocationCityIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          About {neighborhood}
        </Typography>
      </Box>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 2, lineHeight: 1.7 }}
      >
        {paragraph}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Link
          href={`/area/${neighborhoodSlug}`}
          underline="hover"
          sx={{ fontWeight: 500 }}
        >
          {neighborhood} Homes for Sale
        </Link>
        {city && cityStateSlug && (
          <Link
            href={`/city/${cityStateSlug}`}
            underline="hover"
            sx={{ fontWeight: 500 }}
          >
            {city} Homes for Sale
          </Link>
        )}
      </Box>
    </Paper>
  )
}

export default PropertyNeighborhood
