'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material'
import type { SiteSettings } from '@/configs/defaults/site-settings'

interface TileImages {
  explore: Record<string, string>
  lifestyle: Record<string, string>
}

const EXPLORE_LABELS: Record<string, string> = {
  'miami-metro': 'Miami Metro',
  'broward-palm-beach': 'Broward / Palm Beach',
  'port-st-lucie': 'Port St Lucie',
  'orlando': 'Orlando',
  'tampa-st-pete': 'Tampa / St Pete',
  'sarasota': 'Sarasota',
  'sw-florida': 'SW Florida',
  'florida-keys': 'Florida Keys',
}

const LIFESTYLE_LABELS: Record<string, string> = {
  '1-story': '1 Story',
  '1-acres': '1+ Acres',
  '2-story': '2 Story',
  '55-communities': '55+ Communities',
  'condo': 'Condo',
  'foreclosures': 'Foreclosures',
  'gated': 'Gated',
  'country-club': 'Country Club',
  'luxury': 'Luxury',
  'multifamily': 'Multifamily',
  'new-construction': 'New Construction',
  'no-hoa': 'No HOA',
  'ocean-access': 'Ocean Access',
  'pet-friendly': 'Pet Friendly Condos',
  'pool-homes': 'Pool Homes',
  'single-family': 'Single Family',
  'fha-approved': 'FHA Approved',
  'va-approved': 'VA Approved',
  'townhomes': 'Townhomes',
  'waterfront': 'Waterfront',
}

const AdminSiteSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [tileImages, setTileImages] = useState<TileImages | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/site-settings').then((res) => res.json()),
      fetch('/api/admin/tile-images').then((res) => res.json()),
    ])
      .then(([settingsData, tileData]) => {
        setSettings(settingsData)
        setTileImages(tileData)
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (field: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return
    setSettings({ ...settings, [field]: e.target.value })
  }

  const handleSocialChange = (field: keyof SiteSettings['social']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return
    setSettings({ ...settings, social: { ...settings.social, [field]: e.target.value } })
  }

  const handleExploreTileChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tileImages) return
    setTileImages({
      ...tileImages,
      explore: { ...tileImages.explore, [key]: e.target.value },
    })
  }

  const handleLifestyleTileChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tileImages) return
    setTileImages({
      ...tileImages,
      lifestyle: { ...tileImages.lifestyle, [key]: e.target.value },
    })
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const [settingsRes, tileRes] = await Promise.all([
        fetch('/api/admin/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }),
        tileImages
          ? fetch('/api/admin/tile-images', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tileImages),
            })
          : Promise.resolve({ ok: true }),
      ])
      if (!settingsRes.ok) throw new Error('Save failed')
      if (tileRes && !(tileRes as Response).ok) throw new Error('Tile images save failed')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
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

  if (!settings) return null

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Site Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your website&apos;s contact info, social links, images, and SEO metadata.
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
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            General
          </Typography>
          <Stack spacing={2}>
            <TextField label="Site Name" fullWidth size="small" value={settings.siteName} onChange={handleChange('siteName')} />
            <TextField label="Brokerage" fullWidth size="small" value={settings.brokerage} onChange={handleChange('brokerage')} />
            <TextField label="Phone" fullWidth size="small" value={settings.phone} onChange={handleChange('phone')} />
            <TextField label="Email" fullWidth size="small" value={settings.email} onChange={handleChange('email')} />
            <TextField label="Address" fullWidth size="small" value={settings.address} onChange={handleChange('address')} />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Hero Image
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set a background image URL for the homepage hero section. Leave empty for the default gradient.
          </Typography>
          <TextField
            label="Hero Image URL"
            fullWidth
            size="small"
            value={settings.heroImageUrl || ''}
            onChange={handleChange('heroImageUrl')}
            placeholder="https://example.com/hero-image.jpg"
            helperText="Recommended size: 1920x800px or larger"
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Social Links
          </Typography>
          <Stack spacing={2}>
            <TextField label="Facebook" fullWidth size="small" value={settings.social.facebook} onChange={handleSocialChange('facebook')} />
            <TextField label="Instagram" fullWidth size="small" value={settings.social.instagram} onChange={handleSocialChange('instagram')} />
            <TextField label="LinkedIn" fullWidth size="small" value={settings.social.linkedin} onChange={handleSocialChange('linkedin')} />
            <TextField label="YouTube" fullWidth size="small" value={settings.social.youtube} onChange={handleSocialChange('youtube')} />
            <TextField label="Zillow" fullWidth size="small" value={settings.social.zillow} onChange={handleSocialChange('zillow')} />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            SEO / Meta
          </Typography>
          <Stack spacing={2}>
            <TextField label="Meta Title" fullWidth size="small" value={settings.metaTitle} onChange={handleChange('metaTitle')} />
            <TextField label="Meta Description" fullWidth size="small" multiline rows={3} value={settings.metaDescription} onChange={handleChange('metaDescription')} />
            <TextField label="Meta Keywords" fullWidth size="small" multiline rows={2} value={settings.metaKeywords} onChange={handleChange('metaKeywords')} helperText="Comma-separated keywords" />
          </Stack>
        </Paper>

        {tileImages && (
          <>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Explore Listings Tile Images
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set background image URLs for metro area tiles. Leave empty for the default gradient.
              </Typography>
              <Stack spacing={2}>
                {Object.entries(tileImages.explore).map(([key, url]) => (
                  <TextField
                    key={key}
                    label={EXPLORE_LABELS[key] || key}
                    fullWidth
                    size="small"
                    value={url}
                    onChange={handleExploreTileChange(key)}
                    placeholder="https://example.com/image.jpg"
                  />
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Lifestyle Tile Images
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set background image URLs for lifestyle category tiles. Leave empty for the default gradient.
              </Typography>
              <Stack spacing={2}>
                {Object.entries(tileImages.lifestyle).map(([key, url]) => (
                  <TextField
                    key={key}
                    label={LIFESTYLE_LABELS[key] || key}
                    fullWidth
                    size="small"
                    value={url}
                    onChange={handleLifestyleTileChange(key)}
                    placeholder="https://example.com/image.jpg"
                  />
                ))}
              </Stack>
            </Paper>
          </>
        )}

        <Box display="flex" justifyContent="flex-end">
          <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}

export default AdminSiteSettingsPage
