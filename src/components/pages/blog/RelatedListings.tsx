'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, Grid, Paper, Link as MuiLink, Skeleton } from '@mui/material'
import Link from 'next/link'
import type { Property } from 'services/API'
import { APISearch } from 'services/API'
import searchConfig from '@configs/search'

interface RelatedListingsProps {
  tags: string[]
  city?: string
  maxListings?: number
}

function extractCityFromTags(tags: string[]): string | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase()
    if (
      !lower.includes('real estate') &&
      !lower.includes('market') &&
      !lower.includes('buying') &&
      !lower.includes('selling') &&
      !lower.includes('tips') &&
      !lower.includes('guide') &&
      !lower.includes('florida') &&
      tag.length > 2 &&
      tag.length < 40
    ) {
      return tag
    }
  }
  return null
}

function ListingCard({ property }: { property: Property }) {
  const address = property.address
  const street = `${address?.streetNumber || ''} ${address?.streetName || ''} ${address?.streetSuffix || ''}`.trim()
  const cityState = `${address?.city || ''}, ${address?.state || ''} ${address?.zip || ''}`
  const price = property.listPrice ? parseFloat(property.listPrice) : 0
  const beds = property.details?.numBedrooms || '—'
  const baths = property.details?.numBathrooms || '—'
  const sqft = property.details?.sqft || '—'
  const description = property.details?.description || ''
  const snippet = description.length > 120 ? `${description.slice(0, 120)}...` : description
  const image = property.images?.[0]

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', height: '100%' }}>
      {image && (
        <Box
          component="img"
          src={image}
          alt={street}
          sx={{ width: '100%', height: 160, objectFit: 'cover' }}
        />
      )}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {price > 0
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
            : 'Price TBD'}
        </Typography>
        <Typography variant="body2" noWrap>
          {street}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {cityState}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          {beds} bd | {baths} ba | {sqft} sqft
        </Typography>
        {snippet && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.5,
              fontSize: '0.75rem',
            }}
          >
            {snippet}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

const RelatedListings: React.FC<RelatedListingsProps> = ({
  tags,
  city: propCity,
  maxListings = 4,
}) => {
  const [listings, setListings] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState<string | null>(null)

  useEffect(() => {
    const city = propCity || extractCityFromTags(tags)
    if (!city) {
      setLoading(false)
      return
    }
    setSearchCity(city)

    const fetchListings = async () => {
      try {
        const response = await APISearch.fetch(
          {
            get: {
              city,
              status: 'A',
              boardId: searchConfig.defaultBoardId,
              resultsPerPage: maxListings,
              sortBy: 'createdOnDesc',
              listings: true,
            },
            post: {},
          },
          undefined
        )
        setListings(response?.listings ?? [])
      } catch {
        // Silently fail — related listings are non-critical
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [tags, propCity, maxListings])

  if (!loading && listings.length === 0) return null

  return (
    <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Related Listings{searchCity ? ` in ${searchCity}` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Explore properties currently available{searchCity ? ` in ${searchCity}` : ''}.
      </Typography>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: maxListings }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {listings.map((property) => (
            <Grid item xs={12} sm={6} md={3} key={property.mlsNumber}>
              <ListingCard property={property} />
            </Grid>
          ))}
        </Grid>
      )}

      {searchCity && (
        <Box sx={{ mt: 2 }}>
          <Link href={`/search/grid?city=${encodeURIComponent(searchCity)}`} passHref legacyBehavior>
            <MuiLink variant="body2" fontWeight="bold" underline="hover">
              View all listings in {searchCity} →
            </MuiLink>
          </Link>
        </Box>
      )}
    </Box>
  )
}

export default RelatedListings
