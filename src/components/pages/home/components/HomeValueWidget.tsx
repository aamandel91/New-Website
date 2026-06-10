'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography
} from '@mui/material'

const HomeValueWidget = () => {
  const router = useRouter()
  const [address, setAddress] = useState('')

  const handleSubmit = () => {
    if (!address.trim()) return
    const params = new URLSearchParams({ address: address.trim() })
    router.push(`/home-value?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <Box
      sx={{
        bgcolor: '#0F1621',
        py: { xs: 6, md: 8 }
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography
            variant="h4"
            fontWeight={800}
            color="#fff"
            sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
          >
            What&apos;s Your Home Worth?
          </Typography>
          <Typography
            variant="body1"
            color="rgba(255,255,255,0.7)"
            sx={{ maxWidth: 480 }}
          >
            Get a free instant estimate powered by real market data
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%', maxWidth: 560, mt: 1 }}
          >
            <TextField
              placeholder="Enter your property address"
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  borderRadius: 1,
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: '#c8a951' },
                  '&.Mui-focused fieldset': { borderColor: '#c8a951' }
                },
                '& .MuiInputBase-input': {
                  color: '#0F1621',
                  '&::placeholder': { color: 'rgba(0,0,0,0.5)', opacity: 1 }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                bgcolor: '#c8a951',
                color: '#0F1621',
                fontWeight: 700,
                fontSize: '0.9375rem',
                whiteSpace: 'nowrap',
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#b89941' }
              }}
            >
              GET ESTIMATE
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default HomeValueWidget
