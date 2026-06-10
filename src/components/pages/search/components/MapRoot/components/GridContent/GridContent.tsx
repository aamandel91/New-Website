'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Box, Pagination, Stack, Typography } from '@mui/material'

import gridConfig from '@configs/cards-grids'
import searchConfig from '@configs/search'
import { EmptyListings } from '@shared/EmptyStates'
import { PropertyCard, PropertyCarousel, SkeletonCard } from '@shared/Property'

import { type Property } from 'services/API'
import {
  getDefaultRectangle,
  getListingFields,
  getMapPolygons,
  getMapRectangle,
  getPageParams,
  isClientSideSort
} from 'services/Search'
import { useMapOptions } from 'providers/MapOptionsProvider'
import { useSearch } from 'providers/SearchProvider'
import useBreakpoints from 'hooks/useBreakpoints'
import { matchesKeyword } from 'utils/keywordSearch'
import { getMarkerName, isPropertyExcluded } from 'utils/map'
import {
  slicePropertiesPerPage,
  toServerPage,
  updatePageParam
} from 'utils/pagination'
import { filterPriceReduced, sortPropertiesClientSide } from 'utils/properties'
import { getUniqueKey } from 'utils/properties'
import { updateWindowHistory } from 'utils/urls'

import { GridScrollContainer, MultiUnitHeader } from './components'

const { gridSpacing } = gridConfig

const GridContent = ({
  onCardClick
}: {
  onCardClick: (e: React.MouseEvent, property: Property) => void
}) => {
  const params = useSearchParams()
  const { mobile, tablet } = useBreakpoints()
  const { position, layout } = useMapOptions()

  const paramsPage = Number(params.get('page') || 1)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  // `clientPage` used only to split the server response to local pages
  const [clientPage, setClientPage] = useState(paramsPage)
  // `serverPage` used to calculate the server page for request after pagination change
  const serverPage = toServerPage(clientPage)
  const currentServerPage = useRef<number>(1)
  const [serverProperties, setServerProperties] = useState<Property[]>([])
  const [clientProperties, setClientProperties] = useState<Property[]>([])

  const {
    search,
    filters,
    polygons,
    list,
    loading,
    count,
    page,
    multiUnits,
    keywordFilter,
    schoolMeta
  } = useSearch()

  const pagesCount = Math.ceil(count / searchConfig.pageSize)

  // TODO: marker highlighting should be moved inside the Card component
  const hoverMarker = ({ mlsNumber }: Property) => {
    const marker = document.getElementById(getMarkerName(mlsNumber))
    if (marker) {
      marker.classList.add('active')
      // save the ref of markers container on first hover
      if (!containerRef.current) {
        containerRef.current = marker.parentNode!.parentNode as HTMLElement
      }
    }
  }

  const leaveMarker = () => {
    const activeMarkers = containerRef.current?.getElementsByClassName('active')
    // WARN: sometimes the count of active markers is more than 1, so we need to remove all of them
    // this happens when we abort the fetch of the previous pack because of the new UI iteration
    if (activeMarkers) {
      Array.from(activeMarkers).forEach((el) => el.classList.remove('active'))
    }
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handlePageChange = (_event: any, newPage: number) => {
    const newServerPage = toServerPage(newPage)
    if (newServerPage === currentServerPage.current) {
      // update client properties instantly as the server page was not changed
      setClientProperties(slicePropertiesPerPage(serverProperties, newPage))
      scrollToTop()
    }
    setClientPage(newPage)
    // WARN: we can't rely on the router as it rerenders the page
    // when layout 'grid'|'map' changes, because it is a slug of the page route
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

  useEffect(() => leaveMarker(), [filters, multiUnits])

  const { center, zoom } = position
  const muLength = multiUnits.length
  const prevParams = useRef(JSON.stringify({ center, zoom, filters, muLength }))
  const curParams = JSON.stringify({ center, zoom, filters, muLength })
  const shouldResetPage = curParams !== prevParams.current

  // WARN: every `center`|`zoom`|`filters` change should update the URL
  // and reset the page to 1
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
      // WARN: abort fetching if the map is not initialized yet
      if (layout === 'map' && !position.bounds) return
      currentServerPage.current = serverPage
      fetchListings()
    }
  }, [serverPage, layout, position.bounds])

  useEffect(() => scrollToTop(), [multiUnits.length])

  if (mobile || tablet) {
    return (
      <Box
        sx={{
          flex: 1,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <Box sx={{ mt: -3, px: 2 }}>
          <PropertyCarousel properties={serverProperties} loop={false} />
        </Box>
      </Box>
    )
  }

  const showMultiUnits = multiUnits.length > 0

  const filterByKeyword = (properties: Property[]) => {
    if (!keywordFilter?.regex) return properties
    return properties.filter((p) => {
      const text = p.details?.description || p.details?.extras || ''
      return matchesKeyword(
        text,
        keywordFilter.regex,
        keywordFilter.excludeTerms
      )
    })
  }

  const applyClientFilters = (properties: Property[]) => {
    let result = properties
    if (filters.priceReduced) result = filterPriceReduced(result)
    if (isClientSideSort(filters.sortBy)) {
      result = sortPropertiesClientSide(result, filters.sortBy)
    }
    return result
  }

  const propsOrUnits = applyClientFilters(
    filterByKeyword(showMultiUnits ? multiUnits : clientProperties)
  )

  return (
    <GridScrollContainer ref={scrollRef}>
      <Stack
        width="100%"
        spacing={gridSpacing}
        direction={{ xs: 'row', md: 'column' }}
      >
        {showMultiUnits && (
          <MultiUnitHeader unit={multiUnits[0]} count={multiUnits.length} />
        )}

        {schoolMeta?.active &&
          typeof schoolMeta.totalAfterSchoolFilter === 'number' &&
          typeof schoolMeta.totalBeforeSchoolFilter === 'number' &&
          schoolMeta.totalAfterSchoolFilter <
            schoolMeta.totalBeforeSchoolFilter && (
            <Typography
              variant="caption"
              fontStyle="italic"
              color="text.secondary"
              sx={{ px: 1 }}
            >
              Showing {schoolMeta.totalAfterSchoolFilter} listings with schools
              rated {filters.schoolRating}+ (
              {schoolMeta.totalBeforeSchoolFilter -
                schoolMeta.totalAfterSchoolFilter}{' '}
              hidden).
            </Typography>
          )}

        <Stack
          spacing={gridSpacing}
          flexWrap="wrap"
          direction="row"
          justifyContent={{ xs: 'center', md: 'flex-start' }}
          sx={{
            mr: -2,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          {!page || (loading && !clientProperties.length) ? (
            // `page: 0` is a special state after first initial load, before any searches/saves
            Array.from({ length: searchConfig.pageSize }).map((_v, index) => (
              <SkeletonCard key={index} />
            ))
          ) : !loading && !clientProperties.length ? (
            schoolMeta?.active && filters.schoolRating ? (
              <Box sx={{ p: 3, maxWidth: 480 }}>
                <Typography variant="body1" color="text.primary" gutterBottom>
                  No listings found with schools rated {filters.schoolRating}+.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try lowering the school rating, switching the school level to
                  &quot;Any&quot;, or broadening other filters.
                </Typography>
              </Box>
            ) : (
              <EmptyListings />
            )
          ) : (
            propsOrUnits.map((property) => (
              <PropertyCard
                property={property}
                key={getUniqueKey(property)}
                onClick={(e) => onCardClick(e, property)}
                onCardEnter={() => hoverMarker(property)}
                onCardLeave={() => leaveMarker()}
              />
            ))
          )}
        </Stack>

        {count > searchConfig.pageSize && !showMultiUnits && (
          <Box textAlign="center">
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
    </GridScrollContainer>
  )
}

export default GridContent
