'use client'

import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Button, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocationAutocomplete from '@shared/LocationAutocomplete'
import type { LocationResult } from '@shared/LocationAutocomplete'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

export default function SearchWidget() {
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)

  const handleSelect = useCallback((location: LocationResult) => {
    setSelectedLocation(location)
  }, [])

  const handleSearch = () => {
    if (selectedLocation) {
      const city = selectedLocation.address?.city || selectedLocation.name
      const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      router.push(`/search/gallery?city=${encodeURIComponent(city)}`)
    } else {
      router.push('/search/gallery')
    }
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: NAVY }}>
        Search Homes
      </Typography>
      <LocationAutocomplete
        variant="light"
        placeholder="City, neighborhood, or zip..."
        navigate={false}
        onSelect={handleSelect}
      />
      <Button
        variant="contained"
        fullWidth
        startIcon={<SearchIcon />}
        onClick={handleSearch}
        sx={{
          mt: 1.5,
          bgcolor: GOLD,
          color: '#fff',
          fontWeight: 700,
          '&:hover': { bgcolor: '#a8903e' },
        }}
      >
        SEARCH HOMES
      </Button>
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Typography
          component="a"
          href="/search/gallery"
          variant="body2"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Advanced Search
        </Typography>
      </Box>
    </Box>
  )
}
