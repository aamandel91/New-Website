'use client'

import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Skeleton,
  Stack,
  Tab,
  Tabs
} from '@mui/material'

import { type ListingStatus, type ListingType } from '@configs/filters'
import {
  ListingsCounter,
  ListingTypeSelect,
  SortModesSelect
} from '@shared/Filters'

import { type ApiSortBy } from 'services/API'
import type { Filters } from 'services/Search'
import useBreakpoints from 'hooks/useBreakpoints'
import useClientSide from 'hooks/useClientSide'
import { getCatalogUrl } from 'utils/urls'

const statusItems: Array<[ListingStatus, string]> = [
  ['active', 'For Sale'],
  ['sold', 'Sold'],
  ['rent', 'For Rent'],
  ['all', 'All']
]

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
  const clientSide = useClientSide()
  const { mobile } = useBreakpoints()
  const size = mobile ? 'small' : 'medium'

  const { listingStatus, listingType, sortBy, priceReduced, openHouses } =
    searchFilters

  const createFiltersArray = ({
    type = listingType || 'allListings',
    status = listingStatus,
    sort = sortBy,
    priceReducedFlag = priceReduced,
    openHousesFlag = openHouses
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

  const handleTypeChange = (value: ListingType) => {
    const filters = createFiltersArray({ type: value })
    router.push(getCatalogUrl(city, hood, filters))
  }

  const handleStatusChange = (value: ListingStatus) => {
    const filters = createFiltersArray({ status: value })
    router.push(getCatalogUrl(city, hood, filters))
  }

  const handleSortChange = (value: ApiSortBy) => {
    const filters = createFiltersArray({ sort: value })
    router.push(getCatalogUrl(city, hood, filters))
  }

  const handlePriceReducedToggle = () => {
    const filters = createFiltersArray({
      priceReducedFlag: !priceReduced
    })
    router.push(getCatalogUrl(city, hood, filters))
  }

  const handleOpenHousesToggle = () => {
    const filters = createFiltersArray({
      openHousesFlag: !openHouses
    })
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

            <Stack spacing={1} direction="row">
              {clientSide ? (
                <ListingTypeSelect
                  size={size}
                  value={listingType!}
                  onChange={handleTypeChange}
                />
              ) : (
                <Skeleton variant="rounded" sx={{ width: 148, height: 48 }} />
              )}

              {clientSide ? (
                <Tabs
                  value={listingStatus || 'active'}
                  onChange={(_e, value) => handleStatusChange(value as ListingStatus)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': {
                      minHeight: 36,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      px: 2,
                    },
                  }}
                >
                  {statusItems.map(([value, label]) => (
                    <Tab key={value} value={value} label={label} />
                  ))}
                </Tabs>
              ) : (
                <Skeleton variant="rounded" sx={{ width: 257, height: 48 }} />
              )}

              {clientSide && (
                <Stack direction="row" spacing={0.5}>
                  <Button
                    size={size}
                    variant={priceReduced ? 'contained' : 'outlined'}
                    onClick={handlePriceReducedToggle}
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
                    variant={openHouses ? 'contained' : 'outlined'}
                    onClick={handleOpenHousesToggle}
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
              )}
            </Stack>

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
            {/* Top row: essential filters that wrap naturally */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}
            >
              <ListingsCounter count={count} />
              {clientSide ? (
                <ListingTypeSelect
                  size="small"
                  value={listingType!}
                  onChange={handleTypeChange}
                />
              ) : (
                <Skeleton variant="rounded" sx={{ width: 120, height: 36 }} />
              )}
              <SortModesSelect
                filters={searchFilters}
                onChange={handleSortChange}
              />
            </Stack>

            {/* Scrollable row: status tabs + toggle buttons */}
            <Box
              sx={{
                display: 'flex',
                overflowX: 'auto',
                flexWrap: 'nowrap',
                gap: 1,
                pb: 1,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                '& > *': { flexShrink: 0 },
              }}
            >
              {clientSide ? (
                <Tabs
                  value={listingStatus || 'active'}
                  onChange={(_e, value) => handleStatusChange(value as ListingStatus)}
                  variant="scrollable"
                  scrollButtons={false}
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': {
                      minHeight: 36,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      px: 1.5,
                    },
                  }}
                >
                  {statusItems.map(([value, label]) => (
                    <Tab key={value} value={value} label={label} />
                  ))}
                </Tabs>
              ) : (
                <Skeleton variant="rounded" sx={{ width: 200, height: 36 }} />
              )}
              {clientSide && (
                <>
                  <Button
                    size="small"
                    variant={priceReduced ? 'contained' : 'outlined'}
                    onClick={handlePriceReducedToggle}
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
                    size="small"
                    variant={openHouses ? 'contained' : 'outlined'}
                    onClick={handleOpenHousesToggle}
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
                </>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}

export default CatalogFilters
