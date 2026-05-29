'use client'

import { useCallback, useEffect, useState } from 'react'

import { Box, Grid, Link, Typography } from '@mui/material'

import { PropertyCard } from '@shared/Property'

import type { Property } from 'services/API'
import APISearchCSR from 'services/API/APISearchCSR'

interface ListingsGridProps {
  city?: string
  propertyType?: string
  neighborhood?: string
  zip?: string
  status?: string
  limit?: number
}

export default function ListingsGrid({
  city,
  propertyType,
  neighborhood,
  zip,
  status = 'A',
  limit = 12,
}: ListingsGridProps) {
  const [listings, setListings] = useState<Property[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchListings = useCallback(async () => {
    try {
      const response = await APISearchCSR.searchListings({
        boardId: 110,
        city,
        propertyType,
        neighborhood,
        zip,
        status,
        resultsPerPage: limit,
        hasImages: true,
      })

      if (response) {
        setListings(response.listings ?? [])
        setTotalCount(response.count ?? 0)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [city, propertyType, neighborhood, zip, status, limit])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Loading listings...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Unable to load listings
        </Typography>
      </Box>
    )
  }

  if (listings.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No listings found
        </Typography>
      </Box>
    )
  }

  const searchParams = new URLSearchParams()
  if (city) searchParams.set('city', city)
  if (propertyType) searchParams.set('propertyType', propertyType)
  if (neighborhood) searchParams.set('neighborhood', neighborhood)
  if (zip) searchParams.set('zip', zip)
  const viewAllHref = `/search/gallery?${searchParams.toString()}`

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {listings.map((property, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${property.mlsNumber}-${index}`}>
            <PropertyCard property={property} />
          </Grid>
        ))}
      </Grid>

      {totalCount > limit && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link href={viewAllHref} underline="hover">
            <Typography variant="body1" color="primary" fontWeight="bold">
              {(() => {
                const parts: string[] = []
                if (city) parts.push(city)
                if (neighborhood) parts.push(neighborhood)
                if (propertyType) parts.push(propertyType)
                if (zip) parts.push(zip)
                const scope = parts.length > 0 ? parts.join(' ') : 'Florida'
                return `Browse All ${totalCount.toLocaleString()} ${scope} Homes for Sale →`
              })()}
            </Typography>
          </Link>
        </Box>
      )}
    </Box>
  )
}
