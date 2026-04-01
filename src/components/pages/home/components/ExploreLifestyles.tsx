import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'

const LIFESTYLE_TILES = [
  { label: '1 STORY', gradient: 'linear-gradient(135deg, #0F1621 0%, #2c5364 100%)', href: '/search/gallery?type=1-story' },
  { label: '1+ ACRES', gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', href: '/search/gallery?type=1-acres' },
  { label: '2 STORY', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #0F1621 100%)', href: '/search/gallery?type=2-story' },
  { label: '55+ COMMUNITIES', gradient: 'linear-gradient(135deg, #2c5364 0%, #203a43 100%)', href: '/search/gallery?type=55-plus' },
  { label: 'CONDO', gradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 100%)', href: '/search/gallery?type=condo' },
  { label: 'FORECLOSURES & SHORT SALES', gradient: 'linear-gradient(135deg, #3d0c0c 0%, #1a1a2e 100%)', href: '/search/gallery?type=foreclosures' },
  { label: 'GATED', gradient: 'linear-gradient(135deg, #203a43 0%, #0F1621 100%)', href: '/search/gallery?type=gated' },
  { label: 'COUNTRY CLUB', gradient: 'linear-gradient(135deg, #1b4332 0%, #0F1621 100%)', href: '/search/gallery?type=country-club' },
  { label: 'LUXURY', gradient: 'linear-gradient(135deg, #C4A96E 0%, #0F1621 60%, #1a3a4a 100%)', href: '/search/gallery?type=luxury' },
  { label: 'MULTIFAMILY', gradient: 'linear-gradient(135deg, #2c5364 0%, #0F1621 100%)', href: '/search/gallery?type=multifamily' },
  { label: 'NEW CONSTRUCTION', gradient: 'linear-gradient(135deg, #0F1621 0%, #2c5364 60%, #203a43 100%)', href: '/search/gallery?type=new-construction' },
  { label: 'NO HOA', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #203a43 100%)', href: '/search/gallery?type=no-hoa' },
  { label: 'OCEAN ACCESS WATERFRONT', gradient: 'linear-gradient(135deg, #00B5AD 0%, #0F1621 60%, #1a3a4a 100%)', href: '/search/gallery?type=ocean-access' },
  { label: 'PET FRIENDLY CONDOS', gradient: 'linear-gradient(135deg, #2d6a4f 0%, #1a3a4a 100%)', href: '/search/gallery?type=pet-friendly-condos' },
  { label: 'POOL HOMES', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #00B5AD 100%)', href: '/search/gallery?type=pool-homes' },
  { label: 'SINGLE FAMILY', gradient: 'linear-gradient(135deg, #0F1621 0%, #203a43 100%)', href: '/search/gallery?type=single-family' },
  { label: 'FHA APPROVED', gradient: 'linear-gradient(135deg, #203a43 0%, #2c5364 100%)', href: '/search/gallery?type=fha-approved' },
  { label: 'VA APPROVED', gradient: 'linear-gradient(135deg, #0F1621 0%, #1b4332 100%)', href: '/search/gallery?type=va-approved' },
  { label: 'TOWNHOMES', gradient: 'linear-gradient(135deg, #2c5364 0%, #1a3a4a 100%)', href: '/search/gallery?type=townhomes' },
  { label: 'WATERFRONT', gradient: 'linear-gradient(135deg, #00B5AD 0%, #1a3a4a 60%, #0F1621 100%)', href: '/search/gallery?type=waterfront' }
]

const ExploreLifestyles = () => (
  <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#fff' }}>
    <Typography
      variant="h2"
      sx={{
        textAlign: 'center',
        fontSize: { xs: '32px', md: '52px' },
        fontWeight: 200,
        letterSpacing: '6px',
        textTransform: 'uppercase',
        color: '#333',
        mb: { xs: 4, md: 6 }
      }}
    >
      Explore Lifestyles
    </Typography>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: '2px'
      }}
    >
      {LIFESTYLE_TILES.map((tile) => (
        <Link key={tile.label} href={tile.href} style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              height: '300px',
              background: tile.gradient,
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
                background: tile.gradient,
                transition: 'transform 0.3s ease'
              }}
            />
            <Typography
              sx={{
                color: '#fff',
                fontSize: { xs: '24px', md: '32px' },
                fontWeight: 700,
                textTransform: 'uppercase',
                textAlign: 'center',
                zIndex: 2,
                mb: 2,
                px: 2
              }}
            >
              {tile.label}
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

export default ExploreLifestyles
