'use client'

import React from 'react'

import { Box, Button, Typography } from '@mui/material'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

interface ReadyToChatProps {
  headline?: string
  subtext?: string
  buttonText?: string
  buttonLink?: string
}

export default function ReadyToChat({
  headline = 'Ready to Chat?',
  subtext = 'Schedule a free consultation with our team.',
  buttonText = 'SCHEDULE A CALL',
  buttonLink = '/contact'
}: ReadyToChatProps) {
  return (
    <Box
      sx={{
        bgcolor: NAVY,
        borderRadius: 2,
        p: 3,
        textAlign: 'center'
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 1 }}>
        {headline}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'rgba(255,255,255,0.7)', mb: 2.5 }}
      >
        {subtext}
      </Typography>
      <Button
        variant="contained"
        fullWidth
        href={buttonLink}
        sx={{
          bgcolor: GOLD,
          color: '#fff',
          fontWeight: 700,
          '&:hover': { bgcolor: '#a8903e' }
        }}
      >
        {buttonText}
      </Button>
    </Box>
  )
}
