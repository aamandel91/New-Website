import React from 'react'
import { Paper, Stack } from '@mui/material'

interface SidebarProps {
  widgets: React.ReactNode[]
}

export default function Sidebar({ widgets }: SidebarProps) {
  return (
    <Stack spacing={2.5}>
      {widgets.map((widget, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            borderColor: 'divider',
          }}
        >
          {widget}
        </Paper>
      ))}
    </Stack>
  )
}
