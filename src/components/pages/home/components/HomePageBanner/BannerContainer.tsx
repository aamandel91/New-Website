import React from 'react'

import { Box } from '@mui/material'

const BannerContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      minHeight={{ xs: 640, md: 'calc(100svh - 72px)' }}
      position="relative"
      sx={{
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(32, 32, 32, 0.5)',
          zIndex: 1
        }
      }}
    >
      {children}
    </Box>
  )
}

export default BannerContainer
