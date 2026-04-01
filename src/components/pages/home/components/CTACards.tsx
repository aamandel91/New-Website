import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'

const CTA_ITEMS = [
  {
    title: "WHAT'S MY HOME WORTH?",
    description: 'Find the value of your home based on the latest market data and comparable sales.',
    buttonLabel: 'Get Value',
    href: '/estimate',
    gradient: 'linear-gradient(135deg, #1a3a4a 0%, #0F1621 100%)'
  },
  {
    title: 'SCHEDULE A CONSULTATION',
    description: 'Schedule a one on one meeting with us to discuss your real estate goals.',
    buttonLabel: 'Schedule a Consult',
    href: '#contact',
    gradient: 'linear-gradient(135deg, #2c5364 0%, #0F1621 100%)'
  },
  {
    title: 'LIST YOUR HOME WITH US',
    description: 'We will sell your home faster and for a better price with our proven marketing strategies.',
    buttonLabel: 'Learn More',
    href: '/sell',
    gradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 100%)'
  }
]

const CTACards = () => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
      gap: '2px'
    }}
  >
    {CTA_ITEMS.map((item) => (
      <Link key={item.title} href={item.href} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            height: { xs: '280px', md: '320px' },
            background: item.gradient,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 4,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.4)',
              zIndex: 1
            }
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontSize: { xs: '22px', md: '28px' },
              fontWeight: 700,
              textTransform: 'uppercase',
              zIndex: 2,
              mb: 2
            }}
          >
            {item.title}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '14px',
              lineHeight: 1.6,
              zIndex: 2,
              mb: 3,
              maxWidth: '320px'
            }}
          >
            {item.description}
          </Typography>
          <Button
            variant="outlined"
            sx={{
              color: '#fff',
              borderColor: '#fff',
              fontSize: '12px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              px: 3,
              py: 1,
              zIndex: 2,
              borderRadius: '30px',
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.15)' }
            }}
          >
            {item.buttonLabel}
          </Button>
        </Box>
      </Link>
    ))}
  </Box>
)

export default CTACards
