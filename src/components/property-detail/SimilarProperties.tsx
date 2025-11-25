'use client'

import React, { useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material'

import { type Property } from 'services/API'
import PropertyCard from '@shared/Property/Card/Card'

interface SimilarPropertiesProps {
  properties: Property[]
  currentPropertyMls?: string
  title?: string
}

const SimilarProperties: React.FC<SimilarPropertiesProps> = ({
  properties,
  currentPropertyMls,
  title = 'Similar Properties',
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter out current property from similar properties
  const filteredProperties = currentPropertyMls
    ? properties.filter((p) => p.mlsNumber !== currentPropertyMls)
    : properties

  if (filteredProperties.length === 0) {
    return null
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = isMobile ? 300 : isTablet ? 400 : 500
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => scroll('left')}
            size="small"
            sx={{
              border: 1,
              borderColor: 'divider',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={() => scroll('right')}
            size="small"
            sx={{
              border: 1,
              borderColor: 'divider',
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.palette.divider} transparent`,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.divider,
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          // Snap scrolling for better UX
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {filteredProperties.map((property) => (
          <Box
            key={property.mlsNumber}
            sx={{
              flex: '0 0 auto',
              width: {
                xs: '280px',
                sm: '320px',
                md: '360px',
              },
              scrollSnapAlign: 'start',
            }}
          >
            <PropertyCard property={property} size="normal" />
          </Box>
        ))}
      </Box>

      {filteredProperties.length > 3 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, textAlign: 'center' }}
        >
          Showing {filteredProperties.length} similar properties
        </Typography>
      )}
    </Paper>
  )
}

export default SimilarProperties
