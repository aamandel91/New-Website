'use client'

import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'

const METRO_AREAS = [
  { label: 'MIAMI METRO', gradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 60%, #00B5AD 100%)', href: '/miami' },
  { label: 'BROWARD / PALM BEACH METRO', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #2c5364 60%, #0F1621 100%)', href: '/search/gallery?area=broward-palm-beach' },
  { label: 'PORT ST LUCIE METRO', gradient: 'linear-gradient(135deg, #2c5364 0%, #203a43 60%, #0F1621 100%)', href: '/port-st-lucie' },
  { label: 'ORLANDO METRO', gradient: 'linear-gradient(135deg, #0F1621 0%, #1b4332 60%, #2d6a4f 100%)', href: '/orlando' },
  { label: 'TAMPA / ST PETE METRO', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #0F1621 60%, #2c5364 100%)', href: '/tampa' },
  { label: 'SARASOTA METRO', gradient: 'linear-gradient(135deg, #203a43 0%, #2c5364 60%, #0F1621 100%)', href: '/sarasota' },
  { label: 'SW FLORIDA', gradient: 'linear-gradient(135deg, #0F1621 0%, #2c5364 60%, #1a3a4a 100%)', href: '/search/gallery?area=sw-florida' },
  { label: 'FLORIDA KEYS', gradient: 'linear-gradient(135deg, #00B5AD 0%, #1a3a4a 60%, #0F1621 100%)', href: '/search/gallery?area=florida-keys' }
]

const ExploreListings = () => (
  <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#fff' }}>
    <Typography
      variant="h2"
      sx={{
        textAlign: 'center',
        fontSize: { xs: '24px', sm: '32px', md: '42px', lg: '52px' },
        fontWeight: 200,
        letterSpacing: { xs: '3px', md: '6px' },
        textTransform: 'uppercase',
        color: '#333',
        mb: { xs: 4, md: 6 }
      }}
    >
      Explore Listings
    </Typography>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: '2px'
      }}
    >
      {METRO_AREAS.map((area) => (
        <Link key={area.label} href={area.href} style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              height: { xs: '200px', sm: '250px', md: '300px' },
              background: area.gradient,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              '&:hover': {
                '& .tile-bg': { transform: 'scale(1.05)' }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.4)',
                zIndex: 1
              }
            }}
          >
            <Box
              className="tile-bg"
              sx={{
                position: 'absolute',
                inset: 0,
                background: area.gradient,
                transition: 'transform 0.3s ease'
              }}
            />
            <Typography
              sx={{
                color: '#fff',
                fontSize: { xs: '18px', sm: '22px', md: '28px', lg: '32px' },
                fontWeight: 700,
                textTransform: 'uppercase',
                textAlign: 'center',
                zIndex: 2,
                mb: 2,
                px: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word'
              }}
            >
              {area.label}
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
              View Listings
            </Button>
          </Box>
        </Link>
      ))}
    </Box>
  </Box>
)

export default ExploreListings
