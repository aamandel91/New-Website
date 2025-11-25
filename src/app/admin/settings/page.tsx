'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Stack,
  Chip,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useUser } from '@/providers/UserProvider'
import { useRouter } from 'next/navigation'
import APIBase from '@/services/API/APIBase'

interface PpcSettings {
  enabled: boolean
  sources: string[]
  viewThreshold: number
}

interface OrganicSettings {
  enabled: boolean
  viewThreshold: number
}

const AdminSettingsPage = () => {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [ppcSettings, setPpcSettings] = useState<PpcSettings>({
    enabled: true,
    sources: ['ppc', 'cpc', 'paid'],
    viewThreshold: 1,
  })

  const [organicSettings, setOrganicSettings] = useState<OrganicSettings>({
    enabled: true,
    viewThreshold: 4,
  })

  const [newSource, setNewSource] = useState('')

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      router.push('/login')
      return
    }

    loadSettings()
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const api = new APIBase()

      const [ppcResponse, organicResponse] = await Promise.all([
        api.fetchJSON<PpcSettings>('/admin/settings/ppc/registration'),
        api.fetchJSON<OrganicSettings>('/admin/settings/organic/registration'),
      ])

      setPpcSettings(ppcResponse)
      setOrganicSettings(organicResponse)
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const api = new APIBase()

      await Promise.all([
        api.fetchJSON('/admin/settings/ppc/registration', {
          method: 'PATCH',
          body: JSON.stringify(ppcSettings),
        }),
        api.fetchJSON('/admin/settings/organic/registration', {
          method: 'PATCH',
          body: JSON.stringify(organicSettings),
        }),
      ])

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSource = () => {
    if (newSource && !ppcSettings.sources.includes(newSource.toLowerCase())) {
      setPpcSettings({
        ...ppcSettings,
        sources: [...ppcSettings.sources, newSource.toLowerCase()],
      })
      setNewSource('')
    }
  }

  const handleRemoveSource = (source: string) => {
    setPpcSettings({
      ...ppcSettings,
      sources: ppcSettings.sources.filter((s) => s !== source),
    })
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Admin Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure registration requirements for different traffic sources
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Stack spacing={3}>
        {/* PPC Registration Settings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            PPC Traffic Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Force registration on first property details view for paid traffic sources
          </Typography>

          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={ppcSettings.enabled}
                  onChange={(e) =>
                    setPpcSettings({ ...ppcSettings, enabled: e.target.checked })
                  }
                />
              }
              label="Require registration for PPC traffic"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Property View Threshold
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Show registration modal on property view number:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={ppcSettings.viewThreshold}
                onChange={(e) =>
                  setPpcSettings({ ...ppcSettings, viewThreshold: parseInt(e.target.value) || 1 })
                }
                inputProps={{ min: 1, max: 100 }}
                sx={{ width: 120 }}
                helperText="1 = first view (recommended)"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                PPC Traffic Sources
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Traffic with these utm_medium values will require registration
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {ppcSettings.sources.map((source) => (
                  <Chip
                    key={source}
                    label={source}
                    onDelete={() => handleRemoveSource(source)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add source (e.g., paidsearch)"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSource()
                    }
                  }}
                />
                <Button variant="outlined" onClick={handleAddSource}>
                  Add
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Organic Registration Settings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Organic Traffic Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Show optional (dismissible) registration modal for organic traffic
          </Typography>

          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={organicSettings.enabled}
                  onChange={(e) =>
                    setOrganicSettings({ ...organicSettings, enabled: e.target.checked })
                  }
                />
              }
              label="Show registration suggestion for organic traffic"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Property View Threshold
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Show registration modal on property view number:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={organicSettings.viewThreshold}
                onChange={(e) =>
                  setOrganicSettings({ ...organicSettings, viewThreshold: parseInt(e.target.value) || 4 })
                }
                inputProps={{ min: 1, max: 100 }}
                sx={{ width: 120 }}
                helperText="4 = fourth view (recommended)"
              />
            </Box>
          </Stack>
        </Paper>

        {/* Save Button */}
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}

export default AdminSettingsPage
