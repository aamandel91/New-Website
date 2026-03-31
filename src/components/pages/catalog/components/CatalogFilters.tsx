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
    <Stack
      py={{ xs: 1, sm: 1.5 }}
      width="100%"
      spacing={1}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      {count > 0 && (
        <>
          <Box sx={{ minWidth: { md: 218 } }}>
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
              minWidth: { md: 218 },
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <SortModesSelect
              filters={searchFilters}
              onChange={handleSortChange}
            />
          </Box>
        </>
      )}
    </Stack>
  )
}

export default CatalogFilters
