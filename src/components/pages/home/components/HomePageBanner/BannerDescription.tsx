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
    <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
      <Box
        sx={{
          py: { xs: 6, sm: 8, md: 12 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: { xs: '400px', md: '500px' }
        }}
      >
        {title && (
          <Typography
            variant="h1"
            color="common.white"
            sx={{
              mb: 2,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              lineHeight: 1.2,
              fontWeight: 400
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography
            variant="body1"
            color="common.white"
            sx={{
              maxWidth: '600px',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              lineHeight: 1.6,
              opacity: 0.9
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Container>
  )
}

export default BannerDescription
