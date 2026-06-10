import React from 'react'

import { Box, Grid2 as Grid } from '@mui/material'

interface PageWithSidebarProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

export default function PageWithSidebar({
  children,
  sidebar
}: PageWithSidebarProps) {
  return (
    <Grid container spacing={4}>
      {/* Main content */}
      <Grid size={{ xs: 12, lg: 8 }}>{children}</Grid>

      {/* Sidebar */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Box
          sx={{
            position: { lg: 'sticky' },
            top: { lg: 80 },
            maxHeight: { lg: 'calc(100vh - 100px)' },
            overflowY: { lg: 'auto' },
            // Hide scrollbar on sidebar
            '&::-webkit-scrollbar': { width: 0, display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          {sidebar}
        </Box>
      </Grid>
    </Grid>
  )
}
