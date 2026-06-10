'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import BookmarkIcon from '@mui/icons-material/Bookmark'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import LoginDialog from 'components/auth/LoginDialog'

import type { SavedSearch } from 'providers/SiteUserProvider'
import { useSiteUser } from 'providers/SiteUserProvider'

function filterSummary(filters: Record<string, any>): string {
  const parts: string[] = []
  if (filters.minBeds) parts.push(`${filters.minBeds}+ beds`)
  if (filters.minBaths) parts.push(`${filters.minBaths}+ baths`)
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice
      ? `$${Number(filters.minPrice).toLocaleString()}`
      : ''
    const max = filters.maxPrice
      ? `$${Number(filters.maxPrice).toLocaleString()}`
      : ''
    if (min && max) parts.push(`${min} - ${max}`)
    else if (min) parts.push(`${min}+`)
    else parts.push(`Up to ${max}`)
  }
  if (filters.listingType && filters.listingType !== 'allListings') {
    parts.push(filters.listingType)
  }
  if (filters.listingStatus) parts.push(filters.listingStatus)
  return parts.join(', ') || 'All properties'
}

const frequencyLabels: Record<string, string> = {
  instant: 'Instant',
  daily: 'Daily',
  weekly: 'Weekly',
  none: 'Off'
}

export default function SavedSearchesPage() {
  const router = useRouter()
  const { isLoggedIn, savedSearches, updateSavedSearch, deleteSavedSearch } =
    useSiteUser()
  const [loginOpen, setLoginOpen] = useState(false)
  const [editSearch, setEditSearch] = useState<SavedSearch | null>(null)
  const [editName, setEditName] = useState('')
  const [editFrequency, setEditFrequency] = useState('daily')

  if (!isLoggedIn) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Sign in to see your saved searches
        </Typography>
        <Button
          variant="contained"
          onClick={() => setLoginOpen(true)}
          sx={{ mt: 2, bgcolor: '#0F1621' }}
        >
          Sign In / Register
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Container>
    )
  }

  const handleEdit = (search: SavedSearch) => {
    setEditSearch(search)
    setEditName(search.name)
    setEditFrequency(search.alert_frequency)
  }

  const handleSaveEdit = async () => {
    if (!editSearch) return
    await updateSavedSearch(editSearch.id, {
      name: editName,
      alertFrequency: editFrequency
    })
    setEditSearch(null)
  }

  const handleViewResults = (search: SavedSearch) => {
    const params = new URLSearchParams()
    const filters = search.filters as Record<string, any>
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
        My Saved Searches
      </Typography>

      {savedSearches.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            No saved searches yet. Use the &quot;Save Search&quot; button when
            searching to save your criteria.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {savedSearches.map((search) => (
            <Card key={search.id} variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {search.name}
                      {search.new_count > 0 && (
                        <Chip
                          label={`${search.new_count} new`}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {filterSummary(search.filters)}
                    </Typography>
                    <Chip
                      label={`Alerts: ${frequencyLabels[search.alert_frequency] || search.alert_frequency}`}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Stack direction="row">
                    <IconButton size="small" onClick={() => handleEdit(search)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteSavedSearch(search.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<SearchIcon />}
                  onClick={() => handleViewResults(search)}
                >
                  View Results
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={Boolean(editSearch)}
        onClose={() => setEditSearch(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Saved Search</DialogTitle>
        <DialogContent>
          <TextField
            label="Search Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Alert Frequency</InputLabel>
            <Select
              value={editFrequency}
              label="Alert Frequency"
              onChange={(e) => setEditFrequency(e.target.value)}
            >
              <MenuItem value="instant">Instant</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSearch(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
