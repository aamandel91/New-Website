'use client'

import React from 'react'

import FacebookIcon from '@mui/icons-material/Facebook'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import YouTubeIcon from '@mui/icons-material/YouTube'
import { Box, Container, Grid2 as Grid, IconButton, Link, Stack, Typography } from '@mui/material'

const COLUMN_HEADING_SX = {
  color: 'white',
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  mb: 2,
}

const FOOTER_LINK_SX = {
  color: '#999',
  textDecoration: 'none',
  fontSize: '14px',
  lineHeight: 2,
  display: 'block',
  '&:hover': { color: 'white' },
}

const SOCIAL_ICON_SX = {
  color: '#999',
  '&:hover': { color: 'white' },
}

const Footer = () => {
  return (
    <Box sx={{ bgcolor: '#0F1621' }}>
      {/* Main footer content */}
      <Container maxWidth={false} sx={{ maxWidth: 1400, py: { xs: 6, md: 8 }, px: { xs: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {/* CONTACT */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Contact</Typography>
            <Typography sx={{ color: 'white', fontSize: '15px', fontWeight: 600, mb: 1 }}>
              Florida Home Finder
            </Typography>
            <Typography sx={{ color: '#999', fontSize: '14px', lineHeight: 1.8 }}>
              eXp Realty<br />
              10101 W Sample Rd<br />
              Coral Springs, FL 33065
            </Typography>
            <Typography sx={{ color: '#999', fontSize: '14px', mt: 1.5, lineHeight: 1.8 }}>
              P:{' '}
              <Link href="tel:9545550123" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                (954) 555-0123
              </Link>
            </Typography>
            <Typography sx={{ color: '#999', fontSize: '14px', lineHeight: 1.8 }}>
              E:{' '}
              <Link href="mailto:info@floridahomefinder.com" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                info@floridahomefinder.com
              </Link>
            </Typography>
          </Grid>

          {/* CONNECT */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Connect</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                component="a"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="Facebook"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="YouTube"
              >
                <YouTubeIcon />
              </IconButton>
            </Stack>
          </Grid>

          {/* NAVIGATION */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Navigation</Typography>
            <Link href="/search" sx={FOOTER_LINK_SX}>Search</Link>
            <Link href="/florida/broward-county" sx={FOOTER_LINK_SX}>Cities</Link>
            <Link href="/florida" sx={FOOTER_LINK_SX}>Counties</Link>
            <Link href="/florida/broward-county/coral-springs/single-family-homes" sx={FOOTER_LINK_SX}>Property Type</Link>
            <Link href="/sell" sx={FOOTER_LINK_SX}>Sell</Link>
            <Link href="/blog" sx={FOOTER_LINK_SX}>Blog</Link>
          </Grid>

          {/* POPULAR SEARCHES */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Popular Searches</Typography>
            <Link href="/search?sort=createdOnHigh" sx={FOOTER_LINK_SX}>Newest Listings</Link>
            <Link href="/florida/broward-county/coral-springs/single-family-homes" sx={FOOTER_LINK_SX}>Single Family Homes</Link>
            <Link href="/florida/broward-county/coral-springs/condos" sx={FOOTER_LINK_SX}>Condos</Link>
            <Link href="/florida/broward-county/coral-springs/luxury" sx={FOOTER_LINK_SX}>Luxury Homes</Link>
            <Link href="/florida/broward-county/coral-springs/waterfront" sx={FOOTER_LINK_SX}>Waterfront Homes</Link>
          </Grid>
        </Grid>
      </Container>

      {/* Bottom bar */}
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          py: 3,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1400, px: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ gap: 0.5 }}
            >
              {[
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms of Use', href: '/terms-of-use' },
                { label: 'DMCA', href: '/dmca' },
                { label: 'Accessibility', href: '/accessibility' },
              ].map((item, i) => (
                <React.Fragment key={item.href}>
                  {i > 0 && (
                    <Typography component="span" sx={{ color: '#666', fontSize: '13px' }}>
                      |
                    </Typography>
                  )}
                  <Link
                    href={item.href}
                    sx={{
                      color: '#999',
                      fontSize: '13px',
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                    }}
                  >
                    {item.label}
                  </Link>
                </React.Fragment>
              ))}
            </Stack>
            <Typography sx={{ color: '#666', fontSize: '13px', textAlign: 'center' }}>
              &copy; {new Date().getFullYear()} Florida Home Finder. All Rights Reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default Footer
