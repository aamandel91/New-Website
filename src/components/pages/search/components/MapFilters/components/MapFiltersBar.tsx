import React from 'react'

import { Box, Container, Stack } from '@mui/material'

const FiltersBar = ({
  rightSlot,
  secondarySlot,
  children
}: {
  rightSlot?: React.ReactNode
  secondarySlot?: React.ReactNode
  children: React.ReactNode
}) => {
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
        <Stack
          spacing={1}
          direction="row"
          justifyContent={{ xs: 'center', md: 'left' }}
          sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
        >
          {children}
          {/* On desktop, secondary actions render inline */}
          <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
            {secondarySlot}
          </Box>
        </Stack>

        {/* On mobile, secondary actions render as a scrollable row */}
        {secondarySlot && (
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              gap: 1,
              mt: 1,
              pb: 0.5,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              '& > *': { flexShrink: 0 }
            }}
          >
            {secondarySlot}
          </Box>
        )}
      </Container>
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: { sm: 24, lg: 32 },
          display: { xs: 'none', md: 'flex' }
        }}
      >
        {rightSlot}
      </Box>
    </Box>
  )
}

export default FiltersBar
