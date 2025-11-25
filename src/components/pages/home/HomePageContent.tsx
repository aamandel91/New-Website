'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Box, Button, Container, Grid, Typography } from '@mui/material'

import defaultLocation from '@configs/location'
import { StatsWidgets } from '@shared/Stats'

import { useFeatures } from 'providers/FeaturesProvider'

import { FeaturedProperties, HomePageBanner } from './components'

const HomePageContent = () => {
  const features = useFeatures()
  const t = useTranslations('HomePage')

  const { state, defaultFilters } = defaultLocation

  return (
    <Box bgcolor="background.default">
      <HomePageBanner title={t('welcome')} subtitle={t('welcomeDescription')} />
      <FeaturedProperties />

      {/* Explore Listings Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  color: 'text.primary',
                  mb: 2,
                  fontSize: { xs: '1.75rem', sm: '2.25rem' }
                }}
              >
                Explore Listings
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  lineHeight: 1.6
                }}
              >
                Discover a curated selection of premium properties. Browse our comprehensive listing database to find your perfect home or investment opportunity.
              </Typography>
              <Link href="/search" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  View Listings
                </Button>
              </Link>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: '300px',
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">Featured Image</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Explore Lifestyles Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8, bgcolor: '#f9f9f9', mx: -2, px: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: '300px',
                  bgcolor: '#e8e8e8',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">Lifestyle Image</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
              <Typography
                variant="h2"
                sx={{
                  color: 'text.primary',
                  mb: 2,
                  fontSize: { xs: '1.75rem', sm: '2.25rem' }
                }}
              >
                Explore Lifestyles
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  lineHeight: 1.6
                }}
              >
                Learn about the vibrant communities and neighborhoods. Explore the lifestyle, amenities, and culture of different areas to find the perfect place for you.
              </Typography>
              <Link href="/search" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  Learn More
                </Button>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {features.dashboard && <StatsWidgets {...defaultFilters} name={state} />}
    </Box>
  )
}

export default HomePageContent
