'use client'

import React from 'react'

import { AppBar, Box, Button, Container, Stack } from '@mui/material'

import { tenant } from '@/configs/tenant.config'

import UserMenu from 'components/auth/UserMenu'

import { useFeatures } from 'providers/FeaturesProvider'
import useClientSide from 'hooks/useClientSide'

import { NavDropdown, NavLink } from './components/NavMenu'
import {
  Autosuggestion,
  AutosuggestionContainer,
  Logo,
  MobileMenu
} from './components'
import { cityItems, countyItems, propertyTypeItems } from './navData'

const NAV_TEXT_SX = {
  color: 'white',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
  px: 1,
  py: 0.5,
  minWidth: 0,
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.08)'
  }
}

const Header = () => {
  const features = useFeatures()
  const clientSide = useClientSide()

  return (
    <Box sx={{ height: 70 }}>
      <AppBar
        sx={{
          zIndex: 'modal',
          position: 'fixed',
          bgcolor: `${tenant.visualIdentity.colors.headerBackground} !important`,
          color: 'white !important',
          boxShadow: 'none !important',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: 1400,
            py: 0,
            px: { xs: 2, sm: 3 },
            height: 70,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            spacing={1}
          >
            {/* Left: Logo */}
            <Logo />

            {/* Center: Autosuggestion search (if present) + Nav links */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                display: { xs: 'none', md: 'flex' },
                flex: 1,
                justifyContent: 'center'
              }}
            >
              {features.search && (
                <AutosuggestionContainer>
                  <Autosuggestion />
                </AutosuggestionContainer>
              )}
              <NavLink label="Search" href="/search/advanced" />
              <NavLink label="AI Search" href="/ai-search" />
              <NavDropdown label="Cities" items={cityItems} />
              <NavDropdown label="Counties" items={countyItems} />
              <NavDropdown label="Property Type" items={propertyTypeItems} />
              <NavLink label="Sell" href="/sell" />
            </Stack>

            {/* Right: Auth + Blog (desktop) */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {clientSide && <UserMenu />}
              <Button href="/blog" sx={NAV_TEXT_SX}>
                Blog
              </Button>
            </Stack>

            {/* Mobile: hamburger */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <MobileMenu />
            </Box>
          </Stack>
        </Container>
      </AppBar>
    </Box>
  )
}

export default Header
