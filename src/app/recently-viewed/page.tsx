'use client'

import React from 'react'
import { Box, Container, Typography, Stack, Button } from '@mui/material'
import { useRouter } from 'next/navigation'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import { PageTemplate } from '@templates'
import { PropertyCard } from '@shared/Property'
import { EmptyListings } from '@shared/EmptyStates'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import gridConfig from '@configs/cards-grids'

const RecentlyViewedPage = () => {
  const { properties, clearAll } = useRecentlyViewed()
  const router = useRouter()

  return (
    <PageTemplate>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Recently Viewed
          </Typography>
          {properties.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlineIcon />}
              onClick={clearAll}
            >
              Clear All
            </Button>
          )}
        </Stack>

        {properties.length === 0 ? (
          <EmptyListings />
        ) : (
          <Stack
            spacing={gridConfig.gridSpacing}
            flexWrap="wrap"
            direction="row"
            justifyContent="flex-start"
          >
            {properties.map((property) => (
              <PropertyCard
                key={`${property.mlsNumber}-${property.boardId}`}
                property={property}
              />
            ))}
          </Stack>
        )}
      </Container>
    </PageTemplate>
  )
}

export default RecentlyViewedPage
