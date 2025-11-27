'use client'

import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material'
import { Logout as LogoutIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material'
import { useUser } from '@/providers/UserProvider'
import { useOrganization } from '@/providers/OrganizationProvider'
import { useRouter } from 'next/navigation'

export default function AdminHeader() {
  const { profile, logout } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleViewSite = () => {
    window.open('/', '_blank')
  }

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          {organization && (
            <>
              <Typography variant="body2" color="text.secondary">
                {organization.name}
              </Typography>
              <Chip
                label={organization.plan.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {profile?.email}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={handleViewSite}
          >
            View Site
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            color="inherit"
          >
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
