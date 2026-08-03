'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'

const LIFESTYLE_TILES = [
  {
    key: '1-story',
    label: '1 STORY',
    gradient: 'linear-gradient(135deg, #0F1621 0%, #2c5364 100%)',
    href: '/search/gallery?keywords=one+story'
  },
  {
    key: '1-acres',
    label: '1+ ACRES',
    gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
    href: '/search/gallery?minLotSize=1'
  },
  {
    key: '2-story',
    label: '2 STORY',
    gradient: 'linear-gradient(135deg, #1a3a4a 0%, #0F1621 100%)',
    href: '/search/gallery?keywords=two+story'
  },
  {
    key: '55-communities',
    label: '55+ COMMUNITIES',
    gradient: 'linear-gradient(135deg, #2c5364 0%, #203a43 100%)',
    href: '/search/gallery?keywords=55%2B'
  },
  {
    key: 'condo',
    label: 'CONDO',
    gradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 100%)',
    href: '/search/gallery?class=CondoProperty'
  },
  {
    key: 'foreclosures',
    label: 'FORECLOSURES & SHORT SALES',
    gradient: 'linear-gradient(135deg, #3d0c0c 0%, #1a1a2e 100%)',
    href: '/search/gallery?keywords=foreclosure'
  },
  {
    key: 'gated',
    label: 'GATED',
    gradient: 'linear-gradient(135deg, #203a43 0%, #0F1621 100%)',
    href: '/search/gallery?keywords=gated'
  },
  {
    key: 'country-club',
    label: 'COUNTRY CLUB',
    gradient: 'linear-gradient(135deg, #1b4332 0%, #0F1621 100%)',
    href: '/search/gallery?keywords=country+club'
  },
  {
    key: 'luxury',
    label: 'LUXURY',
    gradient: 'linear-gradient(135deg, #C4A96E 0%, #0F1621 60%, #1a3a4a 100%)',
    href: '/search/gallery?minPrice=1000000'
  },
  {
    key: 'multifamily',
    label: 'MULTIFAMILY',
    gradient: 'linear-gradient(135deg, #2c5364 0%, #0F1621 100%)',
    href: '/search/gallery?propertyType=MultiFamily'
  },
  {
    key: 'new-construction',
    label: 'NEW CONSTRUCTION',
    gradient: 'linear-gradient(135deg, #0F1621 0%, #2c5364 60%, #203a43 100%)',
    href: '/search/gallery?keywords=new+construction'
  },
  {
    key: 'no-hoa',
    label: 'NO HOA',
    gradient: 'linear-gradient(135deg, #1a3a4a 0%, #203a43 100%)',
    href: '/search/gallery?keywords=no+hoa'
  },
  {
    key: 'ocean-access',
    label: 'OCEAN ACCESS WATERFRONT',
    gradient: 'linear-gradient(135deg, #00B5AD 0%, #0F1621 60%, #1a3a4a 100%)',
    href: '/search/gallery?keywords=ocean+access'
  },
  {
    key: 'pet-friendly',
    label: 'PET FRIENDLY CONDOS',
    gradient: 'linear-gradient(135deg, #2d6a4f 0%, #1a3a4a 100%)',
    href: '/search/gallery?class=CondoProperty&keywords=pet+friendly'
  },
  {
    key: 'pool-homes',
    label: 'POOL HOMES',
    gradient: 'linear-gradient(135deg, #1a3a4a 0%, #00B5AD 100%)',
    href: '/search/gallery?keywords=pool'
  },
  {
    key: 'single-family',
    label: 'SINGLE FAMILY',
    gradient: 'linear-gradient(135deg, #0F1621 0%, #203a43 100%)',
    href: '/search/gallery?propertyType=Detached'
  },
  {
    key: 'fha-approved',
    label: 'FHA APPROVED',
    gradient: 'linear-gradient(135deg, #203a43 0%, #2c5364 100%)',
    href: '/search/gallery?keywords=fha+approved'
  },
  {
    key: 'va-approved',
    label: 'VA APPROVED',
    gradient: 'linear-gradient(135deg, #0F1621 0%, #1b4332 100%)',
    href: '/search/gallery?keywords=va+approved'
  },
  {
    key: 'townhomes',
    label: 'TOWNHOMES',
    gradient: 'linear-gradient(135deg, #2c5364 0%, #1a3a4a 100%)',
    href: '/search/gallery?propertyType=Att/Row/Twnhouse'
  },
  {
    key: 'waterfront',
    label: 'WATERFRONT',
    gradient: 'linear-gradient(135deg, #00B5AD 0%, #1a3a4a 60%, #0F1621 100%)',
    href: '/search/gallery?keywords=waterfront'
  }
]

const ExploreLifestyles = () => {
  const [tileImages, setTileImages] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/tile-images')
      .then((res) => res.json())
      .then((data) => {
        if (data?.lifestyle) setTileImages(data.lifestyle)
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
        Explore Lifestyles
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: '2px'
        }}
      >
        {LIFESTYLE_TILES.map((tile) => {
          const imageUrl = tileImages[tile.key]
          const bgStyle = imageUrl ? `url(${imageUrl})` : tile.gradient

          return (
            <Link
              prefetch={false}
              key={tile.key}
              href={tile.href}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  height: { xs: '200px', sm: '250px', md: '300px' },
                  background: imageUrl ? 'none' : tile.gradient,
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
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: {
                      xs: '18px',
                      sm: '22px',
                      md: '28px',
                      lg: '32px'
                    },
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
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: 'rgba(255,255,255,0.15)'
                    }
                  }}
                >
                  {tile.label} Homes
                </Button>
              </Box>
            </Link>
          )
        })}
      </Box>
    </Box>
  )
}

export default ExploreLifestyles
