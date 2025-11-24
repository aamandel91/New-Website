import React from 'react'
import Image from 'next/image'

import { Box, Container, Link, Stack, Typography } from '@mui/material'

import content from '@configs/content'
import routes from '@configs/routes'

import { toRem } from 'utils/theme'

const { siteName, siteFooterDescription, siteFooterLogo: logo } = content

import { features } from 'features'

const Footer = () => {
  return (
    <Box bgcolor="primary.main" py={6}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 0, md: 9, lg: 12 }}
            width="100%"
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Image
                  unoptimized
                  alt={siteName}
                  src={logo.url}
                  width={logo.width}
                  height={logo.height}
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </Stack>
              <Typography py={2} pt={1} color="grey.400" whiteSpace="pre-line">
                {siteFooterDescription}
              </Typography>
            </Box>
            <Stack
              py={2}
              direction="row"
              sx={{ flex: 1 }}
              spacing={{ xs: 2, md: 4 }}
            >
              <Box
                sx={{
                  flex: 1,
                  color: 'grey.400',
                  fontSize: toRem(14)
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h5" color="common.white">About</Typography>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>About Us</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>News</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Careers</Link>
                </Stack>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  color: 'grey.400',
                  fontSize: toRem(14)
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h5" color="common.white">Company</Typography>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Our Team</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Partner With Us</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>FAQ</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Blog</Link>
                </Stack>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  color: 'grey.400',
                  fontSize: toRem(14)
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h5" color="common.white">Support</Typography>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Account</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Support Center</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Feedback</Link>
                  <Link href="/" sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Contact Us</Link>
                </Stack>
              </Box>
            </Stack>
          </Stack>
          <Stack spacing={2}>
            <Typography
              textAlign={{ xs: 'center', md: 'left' }}
              color="grey.500"
              variant="body2"
            >
              {features.estimate && (
                <>
                  <Link href={routes.estimate} sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Instant Estimates</Link>
                  {' • '}
                </>
              )}
              <Link href={routes.terms} sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Terms</Link> •{' '}
              <Link href={routes.privacy} sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Privacy</Link> •{' '}
              <Link href={routes.cookies} sx={{ color: 'grey.400', '&:hover': { color: 'secondary.main' } }}>Cookies</Link>
            </Typography>
            <Typography textAlign="center" variant="caption" color="grey.500">
              All rights reserved {new Date().getFullYear()} &copy; {siteName}{' '}
              Inc. <br />
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default Footer
