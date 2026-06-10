'use client'

import React from 'react'

import HomeIcon from '@mui/icons-material/Home'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Box, Breadcrumbs, Link, Typography } from '@mui/material'

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
        ...linkSx
      }}
      href={baseUrl || '/'}
    >
      <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
      Home
    </Link>
  )

  // State (breadcrumb TEXT shows Florida, link goes to search)
  if (state) {
    items.push(
      <Link key="state" underline="hover" sx={linkSx} href="/search?state=FL">
        Florida
      </Link>
    )
  }

  // County (breadcrumb TEXT shows county, link goes to search)
  if (county) {
    items.push(
      <Link
        key="county"
        underline="hover"
        sx={linkSx}
        href={`/search?county=${encodeURIComponent(county)}`}
      >
        {county}
      </Link>
    )
  }

  // City (clean URL)
  if (city) {
    items.push(
      <Link key="city" underline="hover" sx={linkSx} href={`/${slugify(city)}`}>
        {city}
      </Link>
    )
  }

  // Zip (clean URL: /city/zip)
  if (zip && city) {
    items.push(
      <Link
        key="zip"
        underline="hover"
        sx={linkSx}
        href={`/${slugify(city)}/${zip}`}
      >
        {zip}
      </Link>
    )
  } else if (zip) {
    items.push(
      <Link key="zip" underline="hover" sx={linkSx} href={`/search?zip=${zip}`}>
        {zip}
      </Link>
    )
  }

  // Neighborhood (clean URL: /city/neighborhood)
  if (neighborhood && city) {
    items.push(
      <Link
        key="neighborhood"
        underline="hover"
        sx={linkSx}
        href={`/${slugify(city)}/${slugify(neighborhood)}`}
      >
        {neighborhood}
      </Link>
    )
  } else if (neighborhood) {
    items.push(
      <Link
        key="neighborhood"
        underline="hover"
        sx={linkSx}
        href={`/search?neighborhood=${encodeURIComponent(neighborhood)}`}
      >
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
