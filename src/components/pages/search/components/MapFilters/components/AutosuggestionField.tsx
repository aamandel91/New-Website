'use client'

import { Box, Skeleton } from '@mui/material'

import LocationAutocomplete from '@shared/LocationAutocomplete'

import useClientSide from 'hooks/useClientSide'

const SearchField = () => {
  const clientSide = useClientSide()

  return (
    <Box sx={{ flexGrow: 1, pr: 1.5, display: { xs: 'none', md: 'block' } }}>
      {clientSide ? (
        <LocationAutocomplete
          placeholder="Search location..."
          variant="light"
        />
      ) : (
        <Skeleton height={48} width="100%" variant="rounded" />
      )}
    </Box>
  )
}

export default SearchField
