'use client'

import React from 'react'
import Link from 'next/link'

import { Box, Link as MuiLink, Typography } from '@mui/material'

import { displayNameToSlug } from 'utils/templateEngine'

interface CommunityLinkProps {
  city?: string
  state?: string
  county?: string
}

const CommunityLink: React.FC<CommunityLinkProps> = ({
  city,
  state,
  county
}) => {
  if (!city || !state) return null

  const citySlug = displayNameToSlug(city)

  const cityHref = `/${citySlug}`
  const countyHref = county
    ? `/search?county=${encodeURIComponent(county)}`
    : '#'

  return (
    <Box component="section" sx={{ py: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Real Estate in {city}, {state}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Explore more homes for sale in{' '}
        <Link href={cityHref} passHref legacyBehavior>
          <MuiLink underline="hover">{city}</MuiLink>
        </Link>
        {county && (
          <>
            , located in{' '}
            <Link href={countyHref} passHref legacyBehavior>
              <MuiLink underline="hover">{county} County</MuiLink>
            </Link>
          </>
        )}
        , Florida.
      </Typography>
    </Box>
  )
}

export default CommunityLink
