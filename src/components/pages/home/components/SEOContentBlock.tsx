import { Box, Typography } from '@mui/material'

const SEO_SECTIONS = [
  {
    title: 'Find a Florida REALTOR® Near Me',
    text: 'Whether you are buying or selling a home in Florida, having a knowledgeable local REALTOR® by your side makes all the difference. Our experienced agents specialize in South Florida communities from Miami to Palm Beach, helping you navigate the market with confidence.'
  },
  {
    title: 'Florida Community Guides',
    text: 'Explore detailed neighborhood and community guides for cities across Florida. From waterfront living in Fort Lauderdale to family-friendly suburbs in Coral Springs, we provide insights into schools, amenities, lifestyle, and real estate trends to help you find the perfect place to call home.'
  },
  {
    title: 'Updated Florida Real Estate Listings Daily',
    text: 'Our property listings are updated every 15 minutes directly from the MLS, ensuring you have access to the most current homes for sale across Florida. Browse single-family homes, condos, townhouses, and luxury estates with accurate pricing and availability.'
  },
  {
    title: 'Learn All About Florida',
    text: 'Florida offers an unparalleled lifestyle with year-round sunshine, world-class beaches, and no state income tax. Whether you are relocating, investing, or looking for your dream retirement home, our resources cover everything from cost of living to the best neighborhoods in every major metro area.'
  },
  {
    title: 'Florida Home Search Tools',
    text: 'Use our advanced search tools to filter properties by price, location, property type, and lifestyle features. Save your favorite listings, set up custom alerts, and get notified the moment new properties matching your criteria hit the market.'
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
        Your Florida Real Estate Resource!
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
