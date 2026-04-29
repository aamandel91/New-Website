'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useUser } from '@/providers/UserProvider'
import { getTokenSync, expired } from 'utils/tokens'
import AdminSidebar, { DRAWER_WIDTH } from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

function useAdminAuth() {
  const { logged, adminRole, loading } = useUser()
  const [hasAdminToken, setHasAdminToken] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = getTokenSync()
    if (token && !expired(token)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role === 3) { // UserRole.Admin = 3
          setHasAdminToken(true)
        }
      } catch {
        // invalid token
      }
    }
    setChecking(false)
  }, [])

  return {
    isAuthenticated: logged || hasAdminToken,
    isAdmin: adminRole || hasAdminToken,
    loading: loading || checking,
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    if (!loading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [isAuthenticated, loading, router, isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        Loading...
      </Box>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ ml: 1 }}
              aria-label="open navigation"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <AdminHeader />
          </Box>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
