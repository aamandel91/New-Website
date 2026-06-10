'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'

import LoginDialog from 'components/auth/LoginDialog'

import { useSiteUser } from 'providers/SiteUserProvider'
import { ssTrackEvent } from 'utils/suresendTracking'

interface SaveSearchDialogProps {
  open: boolean
  onClose: () => void
  filters: Record<string, any>
  autoName?: string
}

const SaveSearchDialog = ({
  open,
  onClose,
  filters,
  autoName
}: SaveSearchDialogProps) => {
  const { isLoggedIn, createSavedSearch } = useSiteUser()
  const [name, setName] = useState(autoName || '')
  const [frequency, setFrequency] = useState('daily')
  const [saving, setSaving] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleSave = async () => {
    if (!isLoggedIn) {
      setShowLogin(true)
      return
    }

    if (!name.trim()) return

    setSaving(true)
    await createSavedSearch(name.trim(), filters, frequency)
    ssTrackEvent('saved_search', { name, frequency, filters })
    setSaving(false)
    onClose()
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
    // After login, user can proceed to save
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Save This Search</DialogTitle>
        <DialogContent>
          {!isLoggedIn && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sign in or create an account to save searches and get alerts.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowLogin(true)}
                sx={{ bgcolor: '#0F1621', '&:hover': { bgcolor: '#1a2433' } }}
              >
                Sign In / Register
              </Button>
            </Box>
          )}

          <TextField
            label="Search Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 3 Bed Condos in Boca Raton Under $500K"
            sx={{ mb: 3, mt: 1 }}
            autoFocus
          />

          <Typography variant="subtitle2" gutterBottom>
            Alert Frequency
          </Typography>
          <FormControl>
            <RadioGroup
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <FormControlLabel
                value="instant"
                control={<Radio size="small" />}
                label="Instant"
              />
              <FormControlLabel
                value="daily"
                control={<Radio size="small" />}
                label="Daily"
              />
              <FormControlLabel
                value="weekly"
                control={<Radio size="small" />}
                label="Weekly"
              />
              <FormControlLabel
                value="none"
                control={<Radio size="small" />}
                label="None"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !name.trim() || !isLoggedIn}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
            sx={{ bgcolor: '#c8a951', '&:hover': { bgcolor: '#b89941' } }}
          >
            {saving ? 'Saving...' : 'Save Search'}
          </Button>
        </DialogActions>
      </Dialog>

      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        defaultTab={1}
      />
    </>
  )
}

export default SaveSearchDialog
