'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'

import { activeMarkets } from '@configs/page-generation'

const METRO_AREAS = [
  { key: 'miami-metro', label: 'MIAMI METRO', gradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 60%, #00B5AD 100%)', href: '/search/gallery?area=miami-dade' },
  { key: 'broward-palm-beach', label: 'BROWARD / PALM BEACH METRO', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #2c5364 60%, #0F1621 100%)', href: '/search/gallery?area=broward-palm-beach' },
  { key: 'port-st-lucie', label: 'PORT ST LUCIE METRO', gradient: 'linear-gradient(135deg, #2c5364 0%, #203a43 60%, #0F1621 100%)', href: '/search/gallery?area=st-lucie' },
  { key: 'orlando', label: 'ORLANDO METRO', gradient: 'linear-gradient(135deg, #0F1621 0%, #1b4332 60%, #2d6a4f 100%)', href: '/orlando' },
  { key: 'tampa-st-pete', label: 'TAMPA / ST PETE METRO', gradient: 'linear-gradient(135deg, #1a3a4a 0%, #0F1621 60%, #2c5364 100%)', href: '/tampa' },
  { key: 'sarasota', label: 'SARASOTA METRO', gradient: 'linear-gradient(135deg, #203a43 0%, #2c5364 60%, #0F1621 100%)', href: '/sarasota' },
  { key: 'sw-florida', label: 'SW FLORIDA', gradient: 'linear-gradient(135deg, #0F1621 0%, #2c5364 60%, #1a3a4a 100%)', href: '/search/gallery?area=sw-florida' },
  { key: 'florida-keys', label: 'FLORIDA KEYS', gradient: 'linear-gradient(135deg, #00B5AD 0%, #1a3a4a 60%, #0F1621 100%)', href: '/search/gallery?area=florida-keys' }
]

function isActiveMarket(key: string): boolean {
  const keyToMarketId: Record<string, string> = {
    'miami-metro': 'south-florida',
    'broward-palm-beach': 'south-florida',
    'port-st-lucie': 'south-florida',
    'orlando': 'orlando',
    'tampa-st-pete': 'tampa-bay',
    'sarasota': 'sarasota',
    'sw-florida': 'naples-swfl',
    'florida-keys': 'south-florida'
  }
  const marketId = keyToMarketId[key]
  if (!marketId) return false
  return activeMarkets.some(m => m.id === marketId)
}

const ExploreListings = () => {
  const [tileImages, setTileImages] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/tile-images')
      .then((res) => res.json())
      .then((data) => {
        if (data?.explore) setTileImages(data.explore)
      })
      .catch(() => {
        // keep gradient fallback
      })
  }, [])

  return (
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
        {METRO_AREAS.map((area) => {
          const imageUrl = tileImages[area.key]
          const bgStyle = imageUrl
            ? `url(${imageUrl})`
            : area.gradient
          const active = isActiveMarket(area.key)
          const tileHref = active ? area.href : '#'

          return (
            <Link key={area.key} href={tileHref} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  height: { xs: '200px', sm: '250px', md: '300px' },
                  background: imageUrl ? 'none' : area.gradient,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: active ? 'pointer' : 'default',
                  opacity: active ? 1 : 0.6,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    '& .tile-bg': { transform: active ? 'scale(1.05)' : 'none' }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    bgcolor: imageUrl ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.4)',
                    zIndex: 1
                  }
                }}
              >
                <Box
                  className="tile-bg"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: bgStyle,
                    backgroundSize: imageUrl ? 'cover' : undefined,
                    backgroundPosition: imageUrl ? 'center' : undefined,
                    transition: 'transform 0.3s ease'
                  }}
                />
                {!active && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      zIndex: 3
                    }}
                  >
                    Coming Soon
                  </Box>
                )}
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
          )
        })}
      </Box>
    </Box>
  )
}

export default ExploreListings
