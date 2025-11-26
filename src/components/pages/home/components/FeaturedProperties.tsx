'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Box, Container, Grid, Stack, Typography } from '@mui/material'

import { PropertyCard } from '@shared/Property'

import { type ApiQueryParams, type Property } from 'services/API'
import SearchService from 'services/Search'

// Static filters - defined outside component to prevent unnecessary re-renders
const FEATURED_FILTERS: Partial<ApiQueryParams> = {
  class: 'residential',
  minPrice: 200_000,
  resultsPerPage: 12
}

const SOLD_FILTERS: Partial<ApiQueryParams> = {
  ...FEATURED_FILTERS,
  status: 'U',
  sortBy: 'soldDateDesc'
}

const FeaturedProperties = () => {
  const [featured, setFeatured] = useState<Property[]>([])
  const [recentlySold, setRecentlySold] = useState<Property[]>([])
  const t = useTranslations('HomePage')

  const fetchFeatured = useCallback(async () => {
    try {
      const response = await SearchService.fetchListings(FEATURED_FILTERS)
      if (response) setFeatured(response.listings)
    } catch (error) {
      console.error('Featured::Error fetching data', error)
    }
  }, [])

  const fetchRecentlySold = useCallback(async () => {
    try {
      const response = await SearchService.fetchListings(SOLD_FILTERS)
      if (response) setRecentlySold(response.listings)
    } catch (error) {
      console.error('RecentlySold::Error fetching data', error)
    }
  }, [])

  useEffect(() => {
    fetchFeatured()
    fetchRecentlySold()
  }, [fetchFeatured, fetchRecentlySold])

  const PropertySection = ({
    title,
    properties
  }: {
    title: string
    properties: Property[]
  }) => (
    <Box sx={{ mb: 8 }}>
      <Typography
        variant="h2"
        sx={{
          color: '#b19a55',
          mb: 4,
          fontSize: { xs: '1.5rem', sm: '2rem' },
          fontWeight: 400
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={3}>
        {properties.map((property, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${property.mlsNumber}-${index}`}>
            <PropertyCard property={property} openInNewTab={false} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  return (
    <Container maxWidth="lg">
      <Stack spacing={0} py={8}>
        {featured.length > 0 && (
          <PropertySection title={t('justListed')} properties={featured} />
        )}
        {recentlySold.length > 0 && (
          <PropertySection title={t('recentlySold')} properties={recentlySold} />
        )}
      </Stack>
    </Container>
  )
}

export default FeaturedProperties
