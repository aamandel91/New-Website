'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box } from '@mui/material'
import { useUser } from '@/providers/UserProvider'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logged, adminRole, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !logged) {
      router.push('/login')
    } else if (!loading && logged && !adminRole) {
      router.push('/403')
    }
  }, [logged, adminRole, loading, router])

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

  if (!logged || !adminRole) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminHeader />
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
