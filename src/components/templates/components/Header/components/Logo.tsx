'use client'

import React from 'react'

import { Box, Button, Stack, Typography } from '@mui/material'

import routes from '@configs/routes'

import { useUser } from 'providers/UserProvider'
import useClientSide from 'hooks/useClientSide'

const FloridaSVG = () => (
  <svg
    width="28"
    height="40"
    viewBox="0 0 28 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 0L12 1L18 0.5L22 2L24 4L25 7L24 10L22 11L20 10L18 11L16 14L17 17L19 19L21 22L23 25L25 27L27 30L28 33L27 36L25 38L23 39L21 40L19 39L18 37L17 34L16 31L15 28L14 26L12 24L10 23L8 24L6 26L5 29L4 32L3 34L2 35L1 34L0 31L1 27L3 23L5 19L6 15L7 11L8 7L8 0Z"
      fill="white"
      opacity="0.9"
    />
  </svg>
)

const Logo = () => {
  const clientSide = useClientSide()
  const { agentRole, adminRole } = useUser()
  const logoRoute = !clientSide
    ? ''
    : adminRole
      ? routes.adminAgents
      : agentRole
        ? routes.agent
        : routes.home

  return (
    <Box sx={{ minWidth: { xs: 120, sm: 160 } }}>
      <Button
        {...(logoRoute && { href: logoRoute })}
        sx={{
          p: 0,
          px: 0.5,
          minWidth: 0,
          alignContent: 'center',
          '&:hover': { bgcolor: 'transparent' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FloridaSVG />
          <Stack spacing={0} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '2px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              FLORIDA
            </Typography>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 400,
                fontSize: '10px',
                letterSpacing: '3px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              HOME FINDER
            </Typography>
          </Stack>
        </Stack>
      </Button>
    </Box>
  )
}

export default Logo
