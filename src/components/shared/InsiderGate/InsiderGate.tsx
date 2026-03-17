'use client'

import React from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import { useDialog } from 'providers/DialogProvider'
import { useUser } from 'providers/UserProvider'

interface InsiderGateProps {
  children: React.ReactNode
  title?: string
  description?: string
  blur?: boolean
}

const InsiderGate = ({
  children,
  title = 'Unlock Premium Data',
  description = 'Sign up for free to access sold prices, trending neighbourhoods, and exclusive market insights.',
  blur = true,
}: InsiderGateProps) => {
  const { logged } = useUser()
  const { showDialog: showAuth } = useDialog('auth')

  if (logged) return <>{children}</>

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          ...(blur && {
            filter: 'blur(6px)',
            userSelect: 'none',
            pointerEvents: 'none',
          }),
        }}
      >
        {children}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.5)',
          borderRadius: 2,
          zIndex: 1,
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ maxWidth: 320, textAlign: 'center', p: 3 }}>
          <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => showAuth()}
            sx={{ px: 4 }}
          >
            Sign Up Free
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

export default InsiderGate
