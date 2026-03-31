'use client'

import { Button, Stack } from '@mui/material'

import { useSearch } from 'providers/SearchProvider'

const FilterToggleChips = ({ size }: { size: 'medium' | 'small' }) => {
  const { filters, setFilter, addFilters, removeFilter, removeFilters } =
    useSearch()

  const handlePriceReduced = () => {
    if (filters.priceReduced) {
      removeFilter('priceReduced')
    } else {
      setFilter('priceReduced', true)
    }
  }

  const handleOpenHouses = () => {
    if (filters.openHouses) {
      removeFilters(['openHouses', 'minOpenHouseDate'])
    } else {
      const today = new Date().toISOString().split('T')[0]
      addFilters({ openHouses: true, minOpenHouseDate: today })
    }
  }

  return (
    <Stack direction="row" spacing={0.5}>
      <Button
        size={size}
        variant={filters.priceReduced ? 'contained' : 'outlined'}
        onClick={handlePriceReduced}
        sx={{
          whiteSpace: 'nowrap',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          minWidth: 'auto',
          px: 1.5
        }}
      >
        Price Reduced
      </Button>
      <Button
        size={size}
        variant={filters.openHouses ? 'contained' : 'outlined'}
        onClick={handleOpenHouses}
        sx={{
          whiteSpace: 'nowrap',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          minWidth: 'auto',
          px: 1.5
        }}
      >
        Open Houses
      </Button>
    </Stack>
  )
}

export default FilterToggleChips
