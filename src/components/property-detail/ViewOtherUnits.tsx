'use client'

import React, { useState, useEffect } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import ApartmentIcon from '@mui/icons-material/Apartment'
import Link from 'next/link'

import apiSearchCSR from 'services/API/APISearchCSR'
import type { Property } from 'services/API'

interface ViewOtherUnitsProps {
  streetName: string
  streetNumber: string
  city: string
  currentMls: string
  propertyType?: string
}

const CONDO_TYPES = ['condo', 'apartment', 'apt', 'condominium']

const isCondoType = (propertyType?: string): boolean => {
  if (!propertyType) return false
  const lower = propertyType.toLowerCase()
  return CONDO_TYPES.some((t) => lower.includes(t))
}

const ViewOtherUnits: React.FC<ViewOtherUnitsProps> = ({
  streetName,
  streetNumber,
  city,
  currentMls,
  propertyType,
}) => {
  const [unitCount, setUnitCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isCondoType(propertyType) || !streetName || !streetNumber || !city) return

    let cancelled = false
    const fetchUnits = async () => {
      setLoading(true)
      try {
        const result = await apiSearchCSR.searchListings({
          city,
          search: `${streetNumber} ${streetName}`,
          status: 'A',
          resultsPerPage: 50,
          fields: 'mlsNumber',
        })

        if (cancelled) return

        if (result?.listings) {
          const others = result.listings.filter(
            (listing: Property) => listing.mlsNumber !== currentMls
          )
          setUnitCount(others.length)
        } else {
          setUnitCount(0)
        }
      } catch {
        if (!cancelled) setUnitCount(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUnits()
    return () => {
      cancelled = true
    }
  }, [streetName, streetNumber, city, currentMls, propertyType])

  // Don't render for non-condo types
  if (!isCondoType(propertyType)) return null

  // Don't render if no other units found
  if (!loading && (unitCount === null || unitCount === 0)) return null

  const searchUrl = `/search/gallery?streetName=${encodeURIComponent(streetName)}&streetNumber=${encodeURIComponent(streetNumber)}&city=${encodeURIComponent(city)}`

  return (
    <Box sx={{ mt: 1 }}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Checking for other units...
          </Typography>
        </Box>
      ) : (
        unitCount !== null &&
        unitCount > 0 && (
          <Button
            component={Link}
            href={searchUrl}
            startIcon={<ApartmentIcon />}
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            View {unitCount} other unit{unitCount !== 1 ? 's' : ''} at {streetNumber} {streetName}
          </Button>
        )
      )}
    </Box>
  )
}

export default ViewOtherUnits
