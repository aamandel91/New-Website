'use client'

import React from 'react'
import { Breadcrumbs, Link, Typography, Box } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'

interface PropertyBreadcrumbsProps {
  state?: string
  city?: string
  street?: string
  county?: string
  neighborhood?: string
  zip?: string
  baseUrl?: string
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-')
}

const PropertyBreadcrumbs: React.FC<PropertyBreadcrumbsProps> = ({
  state,
  city,
  street,
  county,
  neighborhood,
  zip,
  baseUrl = ''
}) => {
  const linkSx = {
    color: 'text.secondary',
    '&:hover': {
      color: 'primary.main'
    }
  }

  const items: React.ReactNode[] = []

  // Home
  items.push(
    <Link
      key="home"
      underline="hover"
      sx={{
        display: 'flex',
        alignItems: 'center',
        ...linkSx,
      }}
      href={baseUrl || '/'}
    >
      <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
      Home
    </Link>
  )

  // State (hardcoded Florida)
  if (state) {
    items.push(
      <Link key="state" underline="hover" sx={linkSx} href="/state/florida">
        Florida
      </Link>
    )
  }

  // County
  if (county) {
    items.push(
      <Link key="county" underline="hover" sx={linkSx} href={`/county/${slugify(county)}`}>
        {county}
      </Link>
    )
  }

  // City
  if (city) {
    items.push(
      <Link
        key="city"
        underline="hover"
        sx={linkSx}
        href={`/city/${slugify(city)}-${slugify(state || 'fl')}`}
      >
        {city}
      </Link>
    )
  }

  // Zip
  if (zip) {
    items.push(
      <Link key="zip" underline="hover" sx={linkSx} href={`/zip/${zip}`}>
        {zip}
      </Link>
    )
  }

  // Neighborhood
  if (neighborhood) {
    items.push(
      <Link key="neighborhood" underline="hover" sx={linkSx} href={`/area/${slugify(neighborhood)}`}>
        {neighborhood}
      </Link>
    )
  }

  // Address (last item, no link)
  if (street) {
    items.push(
      <Typography key="address" color="text.primary" fontWeight="medium">
        {street}
      </Typography>
    )
  }

  return (
    <Box sx={{ py: 2, px: { xs: 2, md: 0 } }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          }
        }}
      >
        {items}
      </Breadcrumbs>
    </Box>
  )
}

export default PropertyBreadcrumbs
