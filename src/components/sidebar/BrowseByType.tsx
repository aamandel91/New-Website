import React from 'react'

import { Box, Grid2 as Grid, Typography } from '@mui/material'

const NAVY = '#0F1621'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const browseTypes = [
  { label: 'Single Family Homes', slug: 'single-family-homes' },
  { label: 'Condos for Sale', slug: 'condos' },
  { label: 'Townhomes for Sale', slug: 'townhomes' },
  { label: 'Luxury Homes', slug: 'luxury' },
  { label: 'Waterfront Homes', slug: 'waterfront' },
  { label: 'New Construction Homes', slug: 'new-construction' },
  { label: '1+ Acre Homes', slug: 'one-acre-plus' },
  { label: 'Multi-Family Homes', slug: 'multi-family' }
]

interface BrowseByTypeProps {
  city: string
}

export default function BrowseByType({ city }: BrowseByTypeProps) {
  const citySlug = slugify(city)

  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1.5, color: NAVY }}
      >
        Browse by Type
      </Typography>
      <Grid container spacing={0.5}>
        {browseTypes.map((type) => (
          <Grid key={type.slug} size={6}>
            <Typography
              component="a"
              href={`/${citySlug}/${type.slug}`}
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                display: 'block',
                py: 0.5,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {type.label}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
