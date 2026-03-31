'use client'

import React from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Stack,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'

export interface MarketGraphFilterValues {
  beds?: string
  baths?: string
  minPrice?: string
  maxPrice?: string
  propertyType?: string
}

interface MarketGraphFiltersProps {
  filters: MarketGraphFilterValues
  onFilterChange: (filters: MarketGraphFilterValues) => void
}

const BEDS_OPTIONS = ['Any', '1+', '2+', '3+', '4+', '5+']
const BATHS_OPTIONS = ['Any', '1+', '2+', '3+', '4+']
const PROPERTY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'Detached', label: 'Single Family' },
  { value: 'Semi-Detached', label: 'Semi-Detached' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Condo Apt', label: 'Condo' },
]

const MarketGraphFilters: React.FC<MarketGraphFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleSelect = (field: keyof MarketGraphFilterValues) => (e: SelectChangeEvent) => {
    const val = e.target.value
    onFilterChange({
      ...filters,
      [field]: val === 'Any' || val === '' ? undefined : val.replace('+', ''),
    })
  }

  const handlePrice = (field: 'minPrice' | 'maxPrice') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value.replace(/\D/g, '')
    onFilterChange({
      ...filters,
      [field]: val || undefined,
    })
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          flexWrap: 'wrap',
          gap: 1.5,
          '& > *': { minWidth: 100, flex: '1 1 100px', maxWidth: 160 },
        }}
      >
        <FormControl size="small">
          <InputLabel>Beds</InputLabel>
          <Select
            value={filters.beds ? `${filters.beds}+` : 'Any'}
            label="Beds"
            onChange={handleSelect('beds')}
          >
            {BEDS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Baths</InputLabel>
          <Select
            value={filters.baths ? `${filters.baths}+` : 'Any'}
            label="Baths"
            onChange={handleSelect('baths')}
          >
            {BATHS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Min Price"
          value={filters.minPrice ?? ''}
          onChange={handlePrice('minPrice')}
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />

        <TextField
          size="small"
          label="Max Price"
          value={filters.maxPrice ?? ''}
          onChange={handlePrice('maxPrice')}
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />

        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.propertyType ?? ''}
            label="Type"
            onChange={handleSelect('propertyType')}
          >
            {PROPERTY_TYPES.map((pt) => (
              <MenuItem key={pt.value} value={pt.value}>
                {pt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  )
}

export default MarketGraphFilters
