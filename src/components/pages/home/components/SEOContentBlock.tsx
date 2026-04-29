import { Box, Typography } from '@mui/material'
import { tenant } from '@/configs/tenant.config'

const SEO_SECTIONS = [
  {
    title: 'Find a South Florida REALTOR® Near You',
    text: `Whether you are buying or selling a home in South Florida, having a knowledgeable local expert makes all the difference. ${tenant.brand.teamName} specializes in communities across Miami-Dade, Broward, Palm Beach, Martin, and St. Lucie Counties - from waterfront estates in Miami Beach to gated communities in Parkland and golf course homes in Boca Raton.`
  },
  {
    title: 'South Florida Community Guides',
    text: 'Explore detailed neighborhood and community guides for cities across South Florida. From waterfront living in Fort Lauderdale to family-friendly suburbs in Coral Springs and Parkland, we cover schools, amenities, lifestyle, and real estate trends to help you find the right fit.'
  },
  {
    title: 'Updated MLS Listings Every 15 Minutes',
    text: 'Our listings sync directly from the MLS and update every 15 minutes. Browse single-family homes, condos, townhouses, and luxury estates across all five South Florida counties with accurate pricing and real-time availability.'
  },
  {
    title: 'Why Buyers Choose South Florida',
    text: 'South Florida offers year-round warm weather, no state income tax, world-class beaches, and one of the most diverse real estate markets in the country. From the international luxury market in Miami to the family communities of Palm Beach County and the waterfront lifestyle of the Treasure Coast - there is a South Florida that fits every buyer.'
  },
  {
    title: 'Advanced Home Search Tools',
    text: 'Filter by price, location, property type, school district, and lifestyle features. Save searches, set up instant alerts, and get notified the moment a matching property hits the market. No login required to start searching.'
  }
]

const SEOContentBlock = () => (
  <Box sx={{ bgcolor: '#f9f9f9', py: { xs: 6, md: 10 }, px: { xs: 3, md: 6 } }}>
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Typography
        variant="h2"
        sx={{
          textAlign: 'center',
          fontSize: { xs: '28px', md: '36px' },
          fontWeight: 400,
          color: '#333',
          mb: { xs: 4, md: 6 }
        }}
      >
        Your South Florida Real Estate Resource
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4
        }}
      >
        {SEO_SECTIONS.map((section) => (
          <Box key={section.title}>
            <Typography
              variant="h3"
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#333',
                mb: 1.5
              }}
            >
              {section.title}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                lineHeight: 1.8,
                color: '#666'
              }}
            >
              {section.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
)

export default SEOContentBlock
