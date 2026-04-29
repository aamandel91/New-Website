'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Grid2 as Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BusinessIcon from '@mui/icons-material/Business'
import SendIcon from '@mui/icons-material/Send'
import PageWithSidebar from '@/components/layouts/PageWithSidebar'
import InfoPageSidebar from '@/components/sidebar/InfoPageSidebar'
import { trackFormSubmission } from '@/utils/analytics'
import { ssIdentify } from '@/utils/suresendTracking'
import { isFormBlocked } from '@/utils/formFilter'
import { defaultBlockedWords } from '@/configs/defaults/form-filtering'
import { siteSettings } from '@/configs/defaults/site-settings'
import { tenant } from '@/configs/tenant.config'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'
const MAP_CENTER_LNG = -80.2523
const MAP_CENTER_LAT = 26.2652

interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
}

const initialForm: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

function sendToSureSend(data: ContactFormData) {
  fetch('/api/suresend/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      formType: 'contact',
      source: 'contact_page',
    }),
  }).catch((err) => console.error('[SureSend] Contact lead failed:', err))
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const filterResult = isFormBlocked(form, defaultBlockedWords)
    if (filterResult.blocked) {
      setError('Unable to submit form. Please remove prohibited content.')
      setLoading(false)
      return
    }

    try {
      trackFormSubmission(form, 'contact')
      ssIdentify({ email: form.email, name: form.name, phone: form.phone })
      sendToSureSend(form)
      setSuccess(true)
      setForm(initialForm)
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const mapUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+C4A96E(${MAP_CENTER_LNG},${MAP_CENTER_LAT})/${MAP_CENTER_LNG},${MAP_CENTER_LAT},14,0/600x400@2x?access_token=${mapboxToken}`
    : null

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: NAVY, py: { xs: 8, md: 10 }, px: 3, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            Contact {tenant.brand.teamName}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
            We&apos;d love to hear from you. Reach out today.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <PageWithSidebar sidebar={<InfoPageSidebar />}>
          <Grid container spacing={5}>
            {/* Left: Contact Info + Map */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <PhoneIcon sx={{ color: GOLD, fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      <a href={`tel:${siteSettings.phone.replace(/\D/g, '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {siteSettings.phone}
                      </a>
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <EmailIcon sx={{ color: GOLD, fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      <a href={`mailto:${siteSettings.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {siteSettings.email}
                      </a>
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <LocationOnIcon sx={{ color: GOLD, fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {siteSettings.address}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <BusinessIcon sx={{ color: GOLD, fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Brokerage</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {siteSettings.brokerage}
                    </Typography>
                  </Box>
                </Stack>

                {/* Map */}
                {mapUrl && (
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', mt: 2 }}>
                    <img
                      src={mapUrl}
                      alt="Office location map"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Box>
                )}
              </Stack>
            </Grid>

            {/* Right: Form */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={3} sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                  Send Us a Message
                </Typography>

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                    Message sent! We&apos;ll get back to you soon.
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField label="Name" required fullWidth size="small" value={form.name} onChange={handleChange('name')} disabled={loading} />
                    <TextField label="Email" type="email" required fullWidth size="small" value={form.email} onChange={handleChange('email')} disabled={loading} />
                    <TextField label="Phone" type="tel" fullWidth size="small" value={form.phone} onChange={handleChange('phone')} disabled={loading} placeholder="(555) 555-1234" />
                    <TextField label="Message" multiline rows={5} required fullWidth size="small" value={form.message} onChange={handleChange('message')} disabled={loading} />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      endIcon={<SendIcon />}
                      sx={{ py: 1.5, bgcolor: NAVY, '&:hover': { bgcolor: '#1a2435' } }}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Stack>
                </form>
              </Paper>
            </Grid>
          </Grid>
        </PageWithSidebar>
      </Container>
    </Box>
  )
}
