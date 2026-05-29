'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Grid2 as Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CampaignIcon from '@mui/icons-material/Campaign'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import HandshakeIcon from '@mui/icons-material/Handshake'
import DescriptionIcon from '@mui/icons-material/Description'
import PageWithSidebar from '@/components/layouts/PageWithSidebar'
import SellPageSidebar from '@/components/sidebar/SellPageSidebar'
import { trackFormSubmission } from '@/utils/analytics'
import { ssIdentify } from '@/utils/suresendTracking'
import { isFormBlocked } from '@/utils/formFilter'
import { defaultBlockedWords } from '@/configs/defaults/form-filtering'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

const sellingOptions = [
  {
    icon: <AttachMoneyIcon sx={{ fontSize: 48, color: GOLD }} />,
    title: 'Cash Offer',
    description:
      'Get a competitive cash offer on your home with no repairs, no showings, and no hassle. Close on your timeline — as fast as 14 days.',
  },
  {
    icon: <CampaignIcon sx={{ fontSize: 48, color: GOLD }} />,
    title: '7-Day Marketing Program',
    description:
      'We market your home aggressively for 7 days to drive maximum competition and the highest possible sale price — with no long-term commitment.',
  },
  {
    icon: <SwapHorizIcon sx={{ fontSize: 48, color: GOLD }} />,
    title: 'Buy Before You Sell',
    description:
      'Move into your new home before selling your current one. We help you unlock your equity so you can make a strong, non-contingent offer on your next home.',
  },
]

const benefits = [
  {
    icon: <HandshakeIcon sx={{ fontSize: 40, color: GOLD }} />,
    title: 'Flexible Commissions',
    description:
      'Our commission structure is transparent and designed to fit your situation — no surprises, just results.',
  },
  {
    icon: <DescriptionIcon sx={{ fontSize: 40, color: GOLD }} />,
    title: 'Minute to Minute Listing Agreement',
    description:
      'Not satisfied? Cancel your listing agreement at any time with no penalties and no questions asked.',
  },
]

const PROPERTY_TYPES = [
  'Single Family Home',
  'Condo / Townhome',
  'Multi-Family',
  'Land / Lot',
  'Commercial',
  'Other',
]

const INTEREST_OPTIONS = ['Cash Offer', 'Marketing Program', 'Buy Before You Sell']

interface SellFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  propertyType: string
  interest: string
  comments: string
}

const initialForm: SellFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'FL',
  zip: '',
  propertyType: '',
  interest: '',
  comments: '',
}

function sendToSureSend(data: SellFormData) {
  fetch('/api/suresend/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      phone: data.phone,
      message: `Interest: ${data.interest}\nProperty: ${data.address}, ${data.city}, ${data.state} ${data.zip}\nType: ${data.propertyType}\nComments: ${data.comments}`,
      formType: 'contact',
      propertyAddress: `${data.address}, ${data.city}, ${data.state} ${data.zip}`,
      source: 'sell_page',
    }),
  }).catch((err) => console.error('[SureSend] Sell lead failed:', err))
}

export default function SellPage() {
  const [form, setForm] = useState<SellFormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof SellFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const contactData = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      phone: form.phone,
      message: form.comments,
    }

    const filterResult = isFormBlocked(contactData, defaultBlockedWords)
    if (filterResult.blocked) {
      setError('Unable to submit form. Please remove prohibited content.')
      setLoading(false)
      return
    }

    try {
      trackFormSubmission(contactData, 'contact')
      ssIdentify({ email: form.email, name: contactData.name, phone: form.phone })
      sendToSureSend(form)
      setSuccess(true)
      setForm(initialForm)
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: NAVY, py: { xs: 8, md: 12 }, px: 3, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            Options When Selling Your South Florida Home
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
            No matter what you want out of your home sale, you should have options.
          </Typography>
        </Container>
      </Box>

      {/* Main Content with Sidebar */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <PageWithSidebar sidebar={<SellPageSidebar />}>
          {/* Selling Options */}
          <Grid container spacing={4}>
            {sellingOptions.map((opt) => (
              <Grid key={opt.title} size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={2}
                  sx={{ p: 4, height: '100%', textAlign: 'center', borderTop: `3px solid ${GOLD}` }}
                >
                  <Box sx={{ mb: 2 }}>{opt.icon}</Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                    {opt.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                    {opt.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    href="#sell-form"
                    sx={{
                      borderColor: NAVY,
                      color: NAVY,
                      fontWeight: 600,
                      '&:hover': { bgcolor: NAVY, color: 'white' },
                    }}
                  >
                    Get Started
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Benefits */}
          <Box sx={{ bgcolor: '#f5f5f5', py: { xs: 4, md: 6 }, px: 3, borderRadius: 2, mt: 4 }}>
            <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 5 }}>
              Why Work With Us
            </Typography>
            <Stack spacing={4}>
              {benefits.map((b) => (
                <Stack key={b.title} direction="row" spacing={3} alignItems="flex-start">
                  <Box sx={{ mt: 0.5 }}>{b.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      {b.title}
                    </Typography>
                    <Typography color="text.secondary" lineHeight={1.7}>
                      {b.description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Lead Capture Form */}
          <Box id="sell-form" sx={{ mt: 4 }}>
            <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
              Get Started Today
            </Typography>
            <Typography color="text.secondary" textAlign="center" sx={{ mb: 5 }}>
              Fill out the form below and a member of our team will reach out to discuss your options.
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
                Thank you! We&apos;ll be in touch shortly.
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Paper elevation={3} sx={{ p: { xs: 3, md: 4 } }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="First Name" required fullWidth size="small" value={form.firstName} onChange={handleChange('firstName')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Last Name" required fullWidth size="small" value={form.lastName} onChange={handleChange('lastName')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Email" type="email" required fullWidth size="small" value={form.email} onChange={handleChange('email')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Phone" type="tel" required fullWidth size="small" value={form.phone} onChange={handleChange('phone')} disabled={loading} placeholder="(555) 555-1234" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Property Address" required fullWidth size="small" value={form.address} onChange={handleChange('address')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="City" required fullWidth size="small" value={form.city} onChange={handleChange('city')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField label="State" fullWidth size="small" value={form.state} onChange={handleChange('state')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField label="Zip" required fullWidth size="small" value={form.zip} onChange={handleChange('zip')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Property Type" select fullWidth size="small" value={form.propertyType} onChange={handleChange('propertyType')} disabled={loading}>
                      {PROPERTY_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="I am interested in" select fullWidth size="small" value={form.interest} onChange={handleChange('interest')} disabled={loading}>
                      {INTEREST_OPTIONS.map((o) => (
                        <MenuItem key={o} value={o}>{o}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Comments" multiline rows={4} fullWidth size="small" value={form.comments} onChange={handleChange('comments')} disabled={loading} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      sx={{ py: 1.5, bgcolor: NAVY, '&:hover': { bgcolor: '#1a2435' } }}
                    >
                      {loading ? 'Submitting...' : 'Get Started'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Box>
        </PageWithSidebar>
      </Container>
    </Box>
  )
}
