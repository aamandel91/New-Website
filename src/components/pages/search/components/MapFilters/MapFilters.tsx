'use client'

import React, { Suspense } from 'react'

import { Box, Container } from '@mui/material'

import { AdvancedFiltersDialog, AiSearchDialog } from '@shared/Dialogs'
import { ZillowFilterBar } from '@shared/Filters'

import type { Filters } from 'services/Search'
import { useFeatures } from 'providers/FeaturesProvider'
import { useSearch } from 'providers/SearchProvider'
import useBreakpoints from 'hooks/useBreakpoints'

import {
  AiChat,
  AiSearchButton,
  AiSpacesSelect,
  AutosuggestionField,
  LayoutSelect,
  SaveSearchButton
} from './components'

const DesktopOnly = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: { xs: 'none', md: 'block' } }}>{children}</Box>
)

const MapFilters = () => {
  const features = useFeatures()
  const { mobile } = useBreakpoints()
  const size = mobile ? 'small' : 'medium'

  const { filters, count, setFilters, addFilters } = useSearch()

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    // When switching to rent, reset prices
    if (
      newFilters.listingStatus === 'rent' &&
      filters.listingStatus !== 'rent'
    ) {
      addFilters({
        ...newFilters,
        minPrice: 0,
        maxPrice: 0
      })
    } else {
      setFilters({ ...filters, ...newFilters })
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        zIndex: 'appBar',
        py: { xs: 1, sm: 1.5 },
        position: 'relative'
      }}
    >
      <Container sx={{ position: 'relative' }}>
        <ZillowFilterBar
          filters={filters}
          count={count}
          onFilterChange={handleFilterChange}
          autosuggestion={
            features.search && features.searchPosition === 'filters' ? (
              <AutosuggestionField />
            ) : undefined
          }
          saveSearchButton={
            <>
              {features.saveSearch && <SaveSearchButton size={size} />}
              {features.aiSearch && <AiSearchButton size={size} />}
              {features.aiSpaces && (
                <DesktopOnly>
                  <AiSpacesSelect size={size} />
                </DesktopOnly>
              )}
              {features.aiChat && (
                <DesktopOnly>
                  <AiChat />
                </DesktopOnly>
              )}
            </>
          }
        />
      </Container>
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: { sm: 24, lg: 32 },
          display: { xs: 'none', md: 'flex' }
        }}
      >
        <LayoutSelect />
      </Box>

      <Suspense>
        {features.aiSearch && <AiSearchDialog />}
        <AdvancedFiltersDialog />
      </Suspense>
    </Box>
  )
}

export default MapFilters
