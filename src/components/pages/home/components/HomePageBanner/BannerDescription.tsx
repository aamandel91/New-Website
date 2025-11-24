import React from 'react'

import { Box, Container, Typography } from '@mui/material'

const BannerDescription = ({
  title = '',
  subtitle = ''
}: {
  title?: string
  subtitle?: string
}) => {
  if (!title && !subtitle) return null

  return (
    <Container maxWidth="lg" sx={{ position: 'relative' }}>
      {title && (
        <Box
          sx={{
            py: { xs: 4, sm: 6, md: 8 },
            maxWidth: { xs: 'auto', md: '60%' }
          }}
        >
          <Typography
            variant="h1"
            color="common.white"
            sx={{
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
              lineHeight: 1.3,
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
      {subtitle && (
        <Box sx={{ maxWidth: { xs: 'auto', sm: '50%', md: '45%' } }}>
          <Typography
            variant="h4"
            color="common.white"
            sx={{
              p: 2,
              m: -2,
              borderRadius: 1,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      )}
    </Container>
  )
}

export default BannerDescription
