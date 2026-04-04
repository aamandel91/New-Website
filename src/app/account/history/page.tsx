'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import SearchIcon from '@mui/icons-material/Search'

import { useSiteUser } from 'providers/SiteUserProvider'
import LoginDialog from 'components/auth/LoginDialog'

function formatFilters(filters: Record<string, any>): string {
  const parts: string[] = []
  if (filters.minBeds) parts.push(`${filters.minBeds}+ beds`)
  if (filters.minBaths) parts.push(`${filters.minBaths}+ baths`)
  if (filters.minPrice) parts.push(`$${Number(filters.minPrice).toLocaleString()}+`)
  if (filters.maxPrice) parts.push(`up to $${Number(filters.maxPrice).toLocaleString()}`)
  if (filters.listingType && filters.listingType !== 'allListings') parts.push(filters.listingType)
  return parts.join(', ') || 'All properties'
}

export default function SearchHistoryPage() {
  const router = useRouter()
  const { isLoggedIn, user } = useSiteUser()
  const [loginOpen, setLoginOpen] = useState(false)

  if (!isLoggedIn) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Sign in to see your search history</Typography>
        <Button variant="contained" onClick={() => setLoginOpen(true)} sx={{ mt: 2, bgcolor: '#0F1621' }}>
          Sign In / Register
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Container>
    )
  }

  const history = user?.search_history || []

  const handleSearchAgain = (filters: Record<string, any>) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val))
      }
    })
    router.push(`/search/gallery?${params.toString()}`)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Search History
      </Typography>

      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            No search history yet. Your searches will appear here as you browse.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {history.map((entry, idx) => (
            <Card key={idx} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {entry.label || formatFilters(entry.filters)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<SearchIcon />}
                    onClick={() => handleSearchAgain(entry.filters)}
                  >
                    Search Again
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
