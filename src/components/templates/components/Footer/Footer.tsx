'use client'

import React from 'react'

import FacebookIcon from '@mui/icons-material/Facebook'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import YouTubeIcon from '@mui/icons-material/YouTube'
import {
  Box,
  Container,
  Grid2 as Grid,
  IconButton,
  Link,
  Stack,
  Typography
} from '@mui/material'

import { primaryCity } from '@configs/page-generation'
import { siteSettings } from '@/configs/defaults/site-settings'
import { tenant } from '@/configs/tenant.config'

const COLUMN_HEADING_SX = {
  color: 'white',
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  mb: 2
}

const FOOTER_LINK_SX = {
  color: '#999',
  textDecoration: 'none',
  fontSize: '14px',
  lineHeight: 2,
  display: 'block',
  '&:hover': { color: 'white' }
}

const SOCIAL_ICON_SX = {
  color: '#999',
  '&:hover': { color: 'white' }
}

const Footer = () => {
  const phoneDigits = siteSettings.phone.replace(/\D/g, '')
  const primaryCitySlug = primaryCity.toLowerCase().replace(/\s+/g, '-')

  return (
    <Box sx={{ bgcolor: tenant.visualIdentity.colors.footerBackground }}>
      {/* Main footer content */}
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1400, py: { xs: 6, md: 8 }, px: { xs: 3, md: 4 } }}
      >
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {/* CONTACT */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Contact</Typography>
            <Typography
              sx={{ color: 'white', fontSize: '15px', fontWeight: 600, mb: 1 }}
            >
              {siteSettings.siteName}
            </Typography>
            <Typography
              sx={{ color: '#999', fontSize: '14px', lineHeight: 1.8 }}
            >
              {siteSettings.brokerage}
              <br />
              {siteSettings.address}
            </Typography>
            <Typography
              sx={{ color: '#999', fontSize: '14px', mt: 1.5, lineHeight: 1.8 }}
            >
              P:{' '}
              <Link
                href={`tel:${phoneDigits}`}
                sx={{
                  color: '#999',
                  textDecoration: 'none',
                  '&:hover': { color: 'white' }
                }}
              >
                {siteSettings.phone}
              </Link>
            </Typography>
            <Typography
              sx={{ color: '#999', fontSize: '14px', lineHeight: 1.8 }}
            >
              E:{' '}
              <Link
                href={`mailto:${siteSettings.email}`}
                sx={{
                  color: '#999',
                  textDecoration: 'none',
                  '&:hover': { color: 'white' }
                }}
              >
                {siteSettings.email}
              </Link>
            </Typography>
          </Grid>

          {/* CONNECT */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Connect</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                component="a"
                href={siteSettings.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="Facebook"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component="a"
                href={siteSettings.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                component="a"
                href={siteSettings.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                sx={SOCIAL_ICON_SX}
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                component="a"
                href={siteSettings.social.youtube}
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
            <Link href="/search" sx={FOOTER_LINK_SX}>
              Search Florida Homes
            </Link>
            <Link href={`/${primaryCitySlug}`} sx={FOOTER_LINK_SX}>
              {primaryCity} Real Estate
            </Link>
            <Link href="/search?state=FL" sx={FOOTER_LINK_SX}>
              Florida Counties
            </Link>
            <Link
              href={`/${primaryCitySlug}/single-family-homes`}
              sx={FOOTER_LINK_SX}
            >
              {primaryCity} Single Family Homes
            </Link>
            <Link href="/sell" sx={FOOTER_LINK_SX}>
              Sell Your Home
            </Link>
            <Link href="/blog" sx={FOOTER_LINK_SX}>
              Real Estate Blog
            </Link>
          </Grid>

          {/* POPULAR SEARCHES */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography sx={COLUMN_HEADING_SX}>Popular Searches</Typography>
            <Link href="/search?sort=createdOnHigh" sx={FOOTER_LINK_SX}>
              Newest {primaryCity} Listings
            </Link>
            <Link
              href={`/${primaryCitySlug}/single-family-homes`}
              sx={FOOTER_LINK_SX}
            >
              {primaryCity} Single Family Homes
            </Link>
            <Link href={`/${primaryCitySlug}/condos`} sx={FOOTER_LINK_SX}>
              {primaryCity} Condos for Sale
            </Link>
            <Link href={`/${primaryCitySlug}/luxury`} sx={FOOTER_LINK_SX}>
              {primaryCity} Luxury Homes
            </Link>
            <Link href={`/${primaryCitySlug}/waterfront`} sx={FOOTER_LINK_SX}>
              {primaryCity} Waterfront Homes
            </Link>
          </Grid>
        </Grid>
      </Container>

      {/* Bottom bar */}
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          py: 3
        }}
      >
        <Container
          maxWidth={false}
          sx={{ maxWidth: 1400, px: { xs: 3, md: 4 } }}
        >
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
                { label: 'DMCA', href: '/dmca-notice' },
                { label: 'Accessibility', href: '/accessibility' }
              ].map((item, i) => (
                <React.Fragment key={item.href}>
                  {i > 0 && (
                    <Typography
                      component="span"
                      sx={{ color: '#666', fontSize: '13px' }}
                    >
                      |
                    </Typography>
                  )}
                  <Link
                    href={item.href}
                    sx={{
                      color: '#999',
                      fontSize: '13px',
                      textDecoration: 'none',
                      '&:hover': { color: 'white' }
                    }}
                  >
                    {item.label}
                  </Link>
                </React.Fragment>
              ))}
            </Stack>
            <Typography
              sx={{ color: '#666', fontSize: '13px', textAlign: 'center' }}
            >
              &copy; {new Date().getFullYear()} {siteSettings.siteName}. All
              Rights Reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default Footer
