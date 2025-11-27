import { type Metadata } from 'next'
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material'
import { PageTemplate } from '@templates'
import { MarketTrendsWidget } from '@shared/MarketTrends'
import searchConfig from '@configs/search'

interface CityPageProps {
  params: Promise<{
    state: string
    city: string
  }>
  searchParams: Promise<{
    boardId?: string
  }>
}

export async function generateMetadata(props: CityPageProps): Promise<Metadata> {
  const params = await props.params
  const { city, state } = params

  // Format city name for display (replace hyphens with spaces, capitalize)
  const cityName = city
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const stateName = state.toUpperCase()

  return {
    title: `${cityName}, ${stateName} Real Estate Market Trends`,
    description: `View current market trends, statistics, and housing data for ${cityName}, ${stateName}. See median prices, days on market, and market conditions.`,
  }
}

export default async function CityPage(props: CityPageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { city, state } = params
  const { boardId } = searchParams

  // Format city name for display
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
          <Typography color="text.primary">{cityName}</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {cityName}, {stateName} Real Estate
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover current market trends, housing statistics, and valuable insights for {cityName}.
          </Typography>
        </Box>

        {/* Market Trends Widget */}
        <MarketTrendsWidget
          city={cityName}
          state={stateName}
          boardId={board}
          monthsBack={12}
          showDaysOnMarket={true}
          title={`${cityName} Market Trends`}
        />

        {/* Additional Content Sections */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            About {cityName}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {cityName}, {stateName} is a vibrant community with a diverse real estate market.
            Use the market trends above to understand current pricing, inventory levels, and
            market conditions.
          </Typography>
        </Box>

        {/* Call to Action */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Looking for Properties in {cityName}?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Browse active listings, saved searches, and get personalized property recommendations.
          </Typography>
          <Link href={`/search/map?city=${city}&state=${state}`}>
            <Typography variant="body2" color="primary" fontWeight="bold">
              Search Properties in {cityName} →
            </Typography>
          </Link>
        </Box>
      </Container>
    </PageTemplate>
  )
}
