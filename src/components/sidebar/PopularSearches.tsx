import React from 'react'

import { Box, Grid2 as Grid, Typography } from '@mui/material'

const NAVY = '#0F1621'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const searches = [
  { label: 'Just Listed Homes', param: 'sortBy=createdOnDesc' },
  { label: 'Open Houses', param: 'minOpenHouseDate=today' },
  { label: 'Pool Homes', slug: 'pool-homes' },
  { label: '1 Story Homes', slug: 'one-story' },
  { label: 'Gated Communities', slug: 'gated-communities' },
  { label: '55+ Communities', slug: '55-plus' },
  { label: 'No HOA Homes', slug: 'no-hoa' },
  { label: 'Foreclosure Homes', slug: 'foreclosures' },
  { label: 'Pet Friendly Condos', slug: 'pet-friendly-condos' },
  { label: 'Price Reduced Homes', param: 'sortBy=priceReducedDate' }
]

interface PopularSearchesProps {
  city: string
}

export default function PopularSearches({ city }: PopularSearchesProps) {
  const citySlug = slugify(city)

  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1.5, color: NAVY }}
      >
        Popular Searches
      </Typography>
      <Grid container spacing={0.5}>
        {searches.map((s) => {
          const href = s.slug
            ? `/${citySlug}/${s.slug}`
            : `/search/gallery?city=${encodeURIComponent(city)}&${s.param}`

          return (
            <Grid key={s.label} size={6}>
              <Typography
                component="a"
                href={href}
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  display: 'block',
                  py: 0.5,
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {s.label}
              </Typography>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
