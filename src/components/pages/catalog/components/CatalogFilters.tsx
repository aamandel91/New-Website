'use client'

import { useRouter } from 'next/navigation'

import { Box, Stack } from '@mui/material'

import type { ListingStatus, ListingType } from '@configs/filters'
import { ListingsCounter, SortModesSelect, ZillowFilterBar } from '@shared/Filters'

import type { ApiSortBy } from 'services/API'
import type { Filters } from 'services/Search'
import useBreakpoints from 'hooks/useBreakpoints'
import { getCatalogUrl } from 'utils/urls'

const CatalogFilters = ({
  count,
  city,
  hood,
  searchFilters
}: {
  count: number
  city?: string
  hood?: string
  searchFilters: Partial<Filters>
}) => {
  const router = useRouter()
  const { mobile } = useBreakpoints()

  const { sortBy } = searchFilters

  const createFiltersArray = ({
    type = searchFilters.listingType || 'allListings',
    status = searchFilters.listingStatus,
    sort = sortBy,
    priceReducedFlag = false,
    openHousesFlag = false
  }: {
    type?: ListingType
    status?: ListingStatus
    sort?: ApiSortBy
    priceReducedFlag?: boolean
    openHousesFlag?: boolean
  } = {}) => {
    const filters: string[] = []

    if (type !== 'allListings') filters.push(type)
    if (status === 'rent') filters.push('for-rent')
    if (status === 'sold') filters.push('sold')
    if (status === 'all') filters.push('all')
    if (sort !== 'createdOnDesc') filters.push('sort-' + sort)
    if (priceReducedFlag) filters.push('price-reduced')
    if (openHousesFlag) filters.push('open-houses')

    return filters
  }

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const status = newFilters.listingStatus || searchFilters.listingStatus
    const type = newFilters.listingType || searchFilters.listingType || 'allListings'
    const filters = createFiltersArray({
      type,
      status,
      priceReducedFlag: newFilters.priceReduced,
      openHousesFlag: newFilters.openHouses
    })
    router.push(getCatalogUrl(city, hood, filters))
  }

  const handleSortChange = (value: ApiSortBy) => {
    const filters = createFiltersArray({ sort: value })
    router.push(getCatalogUrl(city, hood, filters))
  }

  return (
    <Box py={{ xs: 1, sm: 1.5 }} width="100%">
      {count > 0 && (
        <>
          {/* Desktop layout */}
          <Stack
            spacing={1}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Box sx={{ minWidth: 218 }}>
              <ListingsCounter count={count} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <ZillowFilterBar
                filters={searchFilters}
                onFilterChange={handleFilterChange}
              />
            </Box>

            <Box
              sx={{
                minWidth: 218,
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <SortModesSelect
                filters={searchFilters}
                onChange={handleSortChange}
              />
            </Box>
          </Stack>

          {/* Mobile layout */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}
            >
              <ListingsCounter count={count} />
              <SortModesSelect
                filters={searchFilters}
                onChange={handleSortChange}
              />
            </Stack>
            <ZillowFilterBar
              filters={searchFilters}
              count={count}
              onFilterChange={handleFilterChange}
            />
          </Box>
        </>
      )}
    </Box>
  )
}

export default CatalogFilters
