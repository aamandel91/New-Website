import { type Metadata } from 'next'

import {
  Box,
  Breadcrumbs,
  Container,
  Grid,
  Link,
  Paper,
  Typography
} from '@mui/material'

import searchConfig from '@configs/search'
import { PageTemplate } from '@templates'
import { MarketTrendsWidget } from '@shared/MarketTrends'

interface NeighborhoodPageProps {
  params: Promise<{
    state: string
    city: string
    neighborhood: string
  }>
  searchParams: Promise<{
    boardId?: string
  }>
}

export async function generateMetadata(
  props: NeighborhoodPageProps
): Promise<Metadata> {
  const params = await props.params
  const { city, state, neighborhood } = params

  // Format names for display
  const neighborhoodName = neighborhood
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const cityName = city
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const stateName = state.toUpperCase()

  return {
    title: `${neighborhoodName}, ${cityName}, ${stateName} - Real Estate Market Trends`,
    description: `Explore ${neighborhoodName} neighborhood in ${cityName}, ${stateName}. View market trends, median prices, and housing statistics.`
  }
}

export default async function NeighborhoodPage(props: NeighborhoodPageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { city, state, neighborhood } = params
  const { boardId } = searchParams

  // Format names for display
  const neighborhoodName = neighborhood
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const cityName = city
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const stateName = state.toUpperCase()

  // Parse boardId or use default
  const board = boardId ? parseInt(boardId) : searchConfig.defaultBoardId

  return (
    <PageTemplate>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/" color="inherit">
            Home
          </Link>
          <Link href={`/city/${state}`} color="inherit">
            {stateName}
          </Link>
          <Link href={`/city/${state}/${city}`} color="inherit">
            {cityName}
          </Link>
          <Typography color="text.primary">{neighborhoodName}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {neighborhoodName}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {cityName}, {stateName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore real estate market trends and housing statistics for the{' '}
            {neighborhoodName} neighborhood.
          </Typography>
        </Box>

        {/* Market Trends Widget - City Level */}
        <MarketTrendsWidget
          city={cityName}
          state={stateName}
          boardId={board}
          monthsBack={12}
          showDaysOnMarket={true}
          title={`${cityName} Market Trends`}
        />

        {/* Neighborhood Information */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                About {neighborhoodName}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {neighborhoodName} is a desirable neighborhood in {cityName},{' '}
                {stateName}. The area offers a unique blend of community charm
                and modern amenities.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Market trends shown above reflect the broader {cityName} area.
                Contact a local agent for neighborhood-specific insights.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Neighborhood Highlights
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Close proximity to schools and parks
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Convenient access to shopping and dining
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Active community with local events
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Variety of housing styles and price ranges
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Call to Action */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Find Your Dream Home in {neighborhoodName}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Browse available properties and discover what makes{' '}
            {neighborhoodName} special.
          </Typography>
          <Link href={`/search/map?city=${city}&state=${state}`}>
            <Typography variant="body2" color="primary" fontWeight="bold">
              View Properties in {neighborhoodName} →
            </Typography>
          </Link>
        </Box>
      </Container>
    </PageTemplate>
  )
}
