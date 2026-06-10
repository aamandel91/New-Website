'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  Box,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import searchConfig from '@configs/search'
import { EmptyListings } from '@shared/EmptyStates'
import { SkeletonCard } from '@shared/Property'

import { type Property } from 'services/API'
import {
  getDefaultRectangle,
  getListingFields,
  getMapPolygons,
  getMapRectangle,
  getPageParams
} from 'services/Search'
import { useMapOptions } from 'providers/MapOptionsProvider'
import { useSearch } from 'providers/SearchProvider'
import useBreakpoints from 'hooks/useBreakpoints'
import { formatEnglishPrice } from 'utils/formatters'
import { isPropertyExcluded } from 'utils/map'
import {
  slicePropertiesPerPage,
  toServerPage,
  updatePageParam
} from 'utils/pagination'
import { getSeoUrl } from 'utils/properties'
import { getCDNPath, updateWindowHistory } from 'utils/urls'

const TableContent = () => {
  const params = useSearchParams()
  const { mobile, tablet } = useBreakpoints()
  const { position, layout } = useMapOptions()

  const paramsPage = Number(params.get('page') || 1)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  const [clientPage, setClientPage] = useState(paramsPage)
  const serverPage = toServerPage(clientPage)
  const currentServerPage = useRef<number>(1)
  const [serverProperties, setServerProperties] = useState<Property[]>([])
  const [clientProperties, setClientProperties] = useState<Property[]>([])

  const { search, filters, polygons, list, loading, count, page, multiUnits } =
    useSearch()

  const pagesCount = Math.ceil(count / searchConfig.pageSize)

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handlePageChange = (_event: any, newPage: number) => {
    const newServerPage = toServerPage(newPage)
    if (newServerPage === currentServerPage.current) {
      setClientProperties(slicePropertiesPerPage(serverProperties, newPage))
      scrollToTop()
    }
    setClientPage(newPage)
    updateWindowHistory(updatePageParam(newPage))
  }

  const fetchListings = async () => {
    const { bounds } = position

    const includeZones = polygons.filter((z) => z.type === 'include')
    const excludeZones = polygons.filter((z) => z.type === 'exclude')

    const fetchBounds = includeZones.length
      ? getMapPolygons(includeZones.map((z) => z.coords))
      : bounds
        ? getMapRectangle(bounds)
        : getDefaultRectangle()

    const response = await search({
      ...filters,
      ...fetchBounds,
      ...getListingFields(),
      ...getPageParams(serverPage, excludeZones.length > 0)
    })

    if (!response) return

    const filteredListings = excludeZones.length
      ? response.listings.filter((listing) => {
          const lat = listing.map?.latitude
          const lng = listing.map?.longitude
          if (typeof lat !== 'number' || typeof lng !== 'number') return true
          return !isPropertyExcluded(lat, lng, excludeZones)
        })
      : response.listings

    setServerProperties(filteredListings)
    setClientProperties(slicePropertiesPerPage(filteredListings, clientPage))
    scrollToTop()
  }

  const { center, zoom } = position
  const muLength = multiUnits.length
  const prevParams = useRef(JSON.stringify({ center, zoom, filters, muLength }))
  const curParams = JSON.stringify({ center, zoom, filters, muLength })
  const shouldResetPage = curParams !== prevParams.current

  useEffect(() => {
    if (!center || !zoom) return
    if (!shouldResetPage) return
    prevParams.current = curParams
    setClientPage(1)
  }, [shouldResetPage])

  useEffect(() => {
    if (serverPage === 1) {
      setServerProperties(multiUnits.length ? multiUnits : list)
      setClientProperties(slicePropertiesPerPage(list, clientPage))
      scrollToTop()
    }
  }, [list])

  useEffect(() => {
    if (serverPage !== currentServerPage.current) {
      currentServerPage.current = serverPage
      fetchListings()
    }
  }, [serverPage])

  const handleRowClick = (property: Property) => {
    window.open(getSeoUrl(property), '_blank')
  }

  const getAddress = (property: Property) => {
    const { address } = property
    return [address.streetNumber, address.streetName, address.city]
      .filter(Boolean)
      .join(' ')
  }

  if (mobile || tablet) {
    return null
  }

  if (!page || (loading && !clientProperties.length)) {
    return (
      <Box sx={{ p: 2 }}>
        {Array.from({ length: 6 }).map((_v, index) => (
          <SkeletonCard key={index} />
        ))}
      </Box>
    )
  }

  if (!loading && !clientProperties.length) {
    return <EmptyListings />
  }

  return (
    <Stack
      ref={scrollRef}
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.2s ease-out'
      }}
    >
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Beds</TableCell>
              <TableCell>Baths</TableCell>
              <TableCell>Sqft</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Days on Market</TableCell>
              <TableCell>MLS#</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientProperties.map((property) => (
              <TableRow
                key={`${property.mlsNumber}-${property.boardId}`}
                hover
                onClick={() => handleRowClick(property)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {property.images[0] && (
                    <Box
                      component="img"
                      src={getCDNPath(property.images[0], 'small')}
                      alt=""
                      sx={{
                        width: 60,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 0.5
                      }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatEnglishPrice(property.listPrice)}
                </TableCell>
                <TableCell>{getAddress(property)}</TableCell>
                <TableCell>{property.details?.numBedrooms || '—'}</TableCell>
                <TableCell>{property.details?.numBathrooms || '—'}</TableCell>
                <TableCell>{property.details?.sqft || '—'}</TableCell>
                <TableCell>{property.type || '—'}</TableCell>
                <TableCell>{property.lastStatus || property.status}</TableCell>
                <TableCell>{property.daysOnMarket || '—'}</TableCell>
                <TableCell>{property.mlsNumber}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {count > searchConfig.pageSize && (
        <Box textAlign="center" sx={{ mt: 2 }}>
          <Pagination
            size="small"
            siblingCount={1}
            boundaryCount={1}
            page={clientPage}
            count={pagesCount}
            onChange={handlePageChange}
            sx={{ display: 'inline-block' }}
          />
        </Box>
      )}
    </Stack>
  )
}

export default TableContent
