'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { trackFormSubmission } from '@/utils/analytics'
import { ssIdentify } from '@/utils/suresendTracking'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'
const TOTAL_STEPS = 4

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

function extractFromSlug(slug: string): { address: string; mlsNumber: string } {
  const parts = slug.split('-')
  const mlsNumber = parts[parts.length - 1] || ''
  const addressParts = parts.slice(0, -1)
  const address = addressParts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
  return { address, mlsNumber }
}

function sendToSureSend(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  offerPrice: number | null
  paymentType: string
  downPayment: number
  toured: string
  notes: string
  address: string
  mlsNumber: string
}) {
  const message = [
    `Offer Price: ${data.offerPrice ? formatCurrency(data.offerPrice) : 'Not specified'}`,
    `Payment: ${data.paymentType}`,
    data.paymentType === 'loan' ? `Down Payment: ${data.downPayment}%` : '',
    `Toured: ${data.toured}`,
    data.notes ? `Notes: ${data.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  fetch('/api/suresend/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      phone: data.phone,
      message,
      formType: 'offer',
      propertyAddress: data.address,
      mlsNumber: data.mlsNumber,
      source: 'offer_wizard',
    }),
  }).catch((err) => console.error('[SureSend] Offer lead failed:', err))
}

export default function OfferPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const { address, mlsNumber } = extractFromSlug(slug)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2
  const [hasPrice, setHasPrice] = useState<'yes' | 'no' | ''>('')
  const [offerPrice, setOfferPrice] = useState<number>(500000)

  // Step 3
  const [paymentType, setPaymentType] = useState<'loan' | 'cash' | 'later' | ''>('')
  const [downPayment, setDownPayment] = useState<number>(20)

  // Step 4
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [toured, setToured] = useState<'yes' | 'no' | ''>('')
  const [notes, setNotes] = useState('')

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  const canProceed = (): boolean => {
    if (step === 1) return hasPrice !== ''
    if (step === 2) return paymentType !== ''
    if (step === 3) return firstName !== '' && lastName !== '' && email !== ''
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const name = `${firstName} ${lastName}`.trim()
      trackFormSubmission({ name, email, phone }, 'offer')
      ssIdentify({ email, name, phone })
      sendToSureSend({
        firstName,
        lastName,
        email,
        phone,
        offerPrice: hasPrice === 'yes' ? offerPrice : null,
        paymentType: paymentType || 'later',
        downPayment,
        toured: toured || 'no',
        notes,
        address,
        mlsNumber,
      })
      setSuccess(true)
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Offer Inquiry Submitted
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            A member of our team will reach out shortly to discuss next steps for {address || 'this property'}.
          </Typography>
          <Button variant="contained" href={`/listing/${slug}`} sx={{ bgcolor: NAVY, '&:hover': { bgcolor: '#1a2435' } }}>
            Back to Listing
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 } }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mb: 4, height: 6, borderRadius: 3, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: GOLD } }}
        />

        {/* Step 1: Intro */}
        {step === 0 && (
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              Here&apos;s what to expect
            </Typography>
            <Typography color="text.secondary">
              Starting an offer is a big step. We&apos;ll walk you through a few quick questions to get things started.
            </Typography>
            <Stack spacing={2.5} sx={{ py: 2 }}>
              {[
                { num: '1', title: 'Offer Details', desc: 'We\'ll ask about your offer price and how you plan to pay.' },
                { num: '2', title: 'Payment Info', desc: 'Tell us about your financing — loan, cash, or still deciding.' },
                { num: '3', title: 'Your Contact Info', desc: 'We\'ll need your info so an agent can follow up with you.' },
              ].map((item) => (
                <Stack key={item.num} direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: NAVY,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {item.num}
                  </Box>
                  <Box>
                    <Typography fontWeight={600}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            {address && (
              <Typography variant="body2" color="text.secondary">
                Property: {address} {mlsNumber && `(MLS# ${mlsNumber})`}
              </Typography>
            )}
          </Stack>
        )}

        {/* Step 2: Offer Price */}
        {step === 1 && (
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              Do you have an offer price in mind?
            </Typography>
            <RadioGroup value={hasPrice} onChange={(e) => setHasPrice(e.target.value as 'yes' | 'no')}>
              <FormControlLabel value="yes" control={<Radio />} label="Yes, I have a price in mind" />
              <FormControlLabel value="no" control={<Radio />} label="No, I need help deciding" />
            </RadioGroup>
            {hasPrice === 'yes' && (
              <Stack spacing={2}>
                <TextField
                  label="Offer Price"
                  type="number"
                  fullWidth
                  size="small"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
                />
                <Slider
                  value={offerPrice}
                  onChange={(_, val) => setOfferPrice(val as number)}
                  min={50000}
                  max={5000000}
                  step={10000}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatCurrency}
                  sx={{ color: GOLD }}
                />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {formatCurrency(offerPrice)}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        {/* Step 3: Payment */}
        {step === 2 && (
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              How do you plan to pay?
            </Typography>
            <RadioGroup value={paymentType} onChange={(e) => setPaymentType(e.target.value as 'loan' | 'cash' | 'later')}>
              <FormControlLabel value="loan" control={<Radio />} label="Loan" />
              <FormControlLabel value="cash" control={<Radio />} label="All Cash" />
              <FormControlLabel value="later" control={<Radio />} label="I'll decide later" />
            </RadioGroup>
            {paymentType === 'loan' && (
              <Stack spacing={2}>
                <Typography variant="body2" fontWeight={600}>
                  Down Payment: {downPayment}%
                </Typography>
                <Slider
                  value={downPayment}
                  onChange={(_, val) => setDownPayment(val as number)}
                  min={0}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                  sx={{ color: GOLD }}
                />
              </Stack>
            )}
          </Stack>
        )}

        {/* Step 4: Contact Info */}
        {step === 3 && (
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              Your Contact Information
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField label="First Name" required fullWidth size="small" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField label="Last Name" required fullWidth size="small" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Stack>
              <TextField label="Email" type="email" required fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Phone" type="tel" fullWidth size="small" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-1234" />

              <Typography variant="body2" fontWeight={600} sx={{ pt: 1 }}>
                Have you toured this home?
              </Typography>
              <RadioGroup row value={toured} onChange={(e) => setToured(e.target.value as 'yes' | 'no')}>
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>

              <TextField
                label="Anything else you'd like us to know?"
                multiline
                rows={3}
                fullWidth
                size="small"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Stack>
          </Stack>
        )}

        {/* Navigation */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            sx={{ color: 'text.secondary' }}
          >
            Back
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              sx={{ bgcolor: NAVY, '&:hover': { bgcolor: '#1a2435' } }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!canProceed() || loading}
              onClick={handleSubmit}
              sx={{ bgcolor: NAVY, '&:hover': { bgcolor: '#1a2435' } }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
