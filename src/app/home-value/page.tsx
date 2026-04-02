'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material'

import { ssIdentify } from 'utils/suresendTracking'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddressForm {
  streetAddress: string
  city: string
  state: string
  zipCode: string
}

interface DetailsForm {
  propertyType: string
  style: string
  bedrooms: string
  bathrooms: string
  squareFeet: string
  yearBuilt: string
  garageSpaces: string
  overallQuality: string
  annualTaxes: string
}

interface ContactForm {
  name: string
  email: string
  phone: string
}

interface EstimateResult {
  value: number
  low: number
  high: number
  confidence: number
  history?: {
    mth?: Record<string, { value: number }>
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = ['Address', 'Property Details', 'Contact Info', 'Your Estimate']

const PROPERTY_TYPES = [
  { value: 'Detached', label: 'Detached' },
  { value: 'Semi-Detached', label: 'Semi-Detached' },
  { value: 'Att/Row/Twnhouse', label: 'Townhouse' },
  { value: 'Condo Apt', label: 'Condo' }
]

const STYLES = [
  { value: 'Bungalow', label: 'Bungalow' },
  { value: '1 Storey', label: '1 Storey' },
  { value: '2 Storey', label: '2 Storey' },
  { value: '3 Storey', label: '3 Storey' }
]

const QUALITY_OPTIONS = [
  { value: 'Poor', label: 'Poor' },
  { value: 'Below Average', label: 'Below Average' },
  { value: 'Average', label: 'Average' },
  { value: 'Above Average', label: 'Above Average' },
  { value: 'Excellent', label: 'Excellent' }
]

const INITIAL_ADDRESS: AddressForm = {
  streetAddress: '',
  city: '',
  state: 'FL',
  zipCode: ''
}

const INITIAL_DETAILS: DetailsForm = {
  propertyType: 'Detached',
  style: '2 Storey',
  bedrooms: '',
  bathrooms: '',
  squareFeet: '',
  yearBuilt: '',
  garageSpaces: '',
  overallQuality: 'Average',
  annualTaxes: ''
}

const INITIAL_CONTACT: ContactForm = {
  name: '',
  email: '',
  phone: ''
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

function HistoryChart({
  history
}: {
  history: Record<string, { value: number }>
}) {
  const entries = Object.entries(history)
    .filter(([, v]) => v && v.value > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)

  if (entries.length < 2) return null

  const width = 600
  const height = 200
  const pad = { top: 20, right: 20, bottom: 32, left: 60 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const values = entries.map(([, v]) => v.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const yPad = range * 0.1

  const xScale = (i: number) => pad.left + (i / (entries.length - 1)) * chartW
  const yScale = (val: number) =>
    pad.top + chartH - ((val - (minVal - yPad)) / (range + yPad * 2)) * chartH

  const points = entries.map(([, v], i) => ({
    x: xScale(i),
    y: yScale(v.value)
  }))
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ')
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${pad.top + chartH}` +
    ` L${points[0].x},${pad.top + chartH} Z`

  const formatShort = (v: number): string => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${Math.round(v / 1_000)}k`
    return `$${v}`
  }

  const yTicks = Array.from(
    { length: 4 },
    (_, i) => minVal - yPad + (i / 3) * (range + yPad * 2)
  )

  const xLabelStep = Math.max(1, Math.floor(entries.length / 6))

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="history-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1976d2" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#1976d2" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {yTicks.map((tick, i) => (
        <React.Fragment key={`ytick-${i}`}>
          <line
            x1={pad.left}
            y1={yScale(tick)}
            x2={width - pad.right}
            y2={yScale(tick)}
            stroke="#e0e0e0"
            strokeDasharray="4 4"
          />
          <text
            x={pad.left - 6}
            y={yScale(tick) + 4}
            textAnchor="end"
            fill="#999"
            fontSize={11}
          >
            {formatShort(Math.round(tick))}
          </text>
        </React.Fragment>
      ))}
      {entries.map(([date], i) =>
        i % xLabelStep === 0 || i === entries.length - 1 ? (
          <text
            key={`xtick-${i}`}
            x={xScale(i)}
            y={height - 4}
            textAnchor="middle"
            fill="#999"
            fontSize={11}
          >
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit'
            })}
          </text>
        ) : null
      )}
      <path d={areaPath} fill="url(#history-area-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#1976d2"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#1976d2"
          stroke="#fff"
          strokeWidth={1.5}
        >
          <title>
            {new Date(entries[i][0] + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit'
            })}
            : {formatCurrency(entries[i][1].value)}
          </title>
        </circle>
      ))}
    </svg>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let label: string
  let color: string
  let bgColor: string

  if (confidence < 0.15) {
    label = 'High Confidence'
    color = '#2e7d32'
    bgColor = '#e8f5e9'
  } else if (confidence <= 0.25) {
    label = 'Medium Confidence'
    color = '#f57f17'
    bgColor = '#fff8e1'
  } else {
    label = 'Low Confidence'
    color = '#c62828'
    bgColor = '#ffebee'
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        fontSize: '0.875rem',
        fontWeight: 600,
        color,
        bgcolor: bgColor
      }}
    >
      {label}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HomeValuePage() {
  const [activeStep, setActiveStep] = useState(0)
  const [address, setAddress] = useState<AddressForm>(INITIAL_ADDRESS)
  const [details, setDetails] = useState<DetailsForm>(INITIAL_DETAILS)
  const [contact, setContact] = useState<ContactForm>(INITIAL_CONTACT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [monthlyUpdates, setMonthlyUpdates] = useState(false)

  // Validation
  const isStep1Valid =
    address.streetAddress.trim() !== '' &&
    address.city.trim() !== '' &&
    address.zipCode.trim() !== ''

  const isStep2Valid =
    details.bedrooms.trim() !== '' &&
    details.bathrooms.trim() !== '' &&
    details.squareFeet.trim() !== ''

  const isStep3Valid =
    contact.name.trim() !== '' &&
    contact.email.trim() !== '' &&
    contact.phone.trim() !== ''

  const handleAddressChange =
    (field: keyof AddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setAddress((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleDetailsChange =
    (field: keyof DetailsForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDetails((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleContactChange =
    (field: keyof ContactForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setContact((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleSubmitLead = async () => {
    if (!isStep3Valid) return
    setLoading(true)
    setError(null)

    try {
      // 1. Identify with SureSend pixel
      ssIdentify({
        email: contact.email.trim(),
        name: contact.name.trim(),
        phone: contact.phone.trim()
      })

      // 2. Submit lead to SureSend
      await fetch('/api/suresend/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          message: `Home estimate request for ${address.streetAddress}, ${address.city}, ${address.state} ${address.zipCode}`,
          formType: 'contact',
          source: 'home_estimate',
          tags: 'seller_lead,home_estimate'
        })
      })

      // 3. Get the estimate
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streetAddress: address.streetAddress,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          bedrooms: parseInt(details.bedrooms),
          bathrooms: parseInt(details.bathrooms),
          squareFeet: parseInt(details.squareFeet),
          propertyType: details.propertyType,
          style: details.style,
          yearBuilt: details.yearBuilt
            ? parseInt(details.yearBuilt)
            : undefined,
          garageSpaces: details.garageSpaces
            ? parseInt(details.garageSpaces)
            : undefined,
          overallQuality: details.overallQuality,
          annualTaxes: details.annualTaxes
            ? parseInt(details.annualTaxes)
            : undefined
        })
      })

      if (!res.ok) throw new Error('Failed to get estimate')

      const data = await res.json()
      setResult({
        value: data.value ?? data.estimate ?? 0,
        low: data.low ?? data.estimateLow ?? 0,
        high: data.high ?? data.estimateHigh ?? 0,
        confidence: data.confidence ?? 0,
        history: data.history
      })
      setActiveStep(3)
    } catch {
      setError(
        'Unable to generate an estimate. Please check your details and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <Box>
      <Typography variant="body1" color="rgba(255,255,255,0.8)" sx={{ mb: 3 }}>
        Tell us about the property location
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Street Address"
            value={address.streetAddress}
            onChange={handleAddressChange('streetAddress')}
            fullWidth
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="City"
            value={address.city}
            onChange={handleAddressChange('city')}
            fullWidth
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="State"
            value={address.state}
            onChange={handleAddressChange('state')}
            fullWidth
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Zip Code"
            value={address.zipCode}
            onChange={handleAddressChange('zipCode')}
            fullWidth
            required
            sx={fieldSx}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        size="large"
        disabled={!isStep1Valid}
        onClick={() => setActiveStep(1)}
        sx={goldButtonSx}
      >
        Next
      </Button>
    </Box>
  )

  const renderStep2 = () => (
    <Box>
      <Typography variant="body1" color="rgba(255,255,255,0.8)" sx={{ mb: 3 }}>
        Provide property details for a more accurate estimate
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Property Type"
            value={details.propertyType}
            onChange={handleDetailsChange('propertyType')}
            fullWidth
            select
            sx={fieldSx}
          >
            {PROPERTY_TYPES.map((pt) => (
              <MenuItem key={pt.value} value={pt.value}>
                {pt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Style"
            value={details.style}
            onChange={handleDetailsChange('style')}
            fullWidth
            select
            sx={fieldSx}
          >
            {STYLES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Bedrooms"
            value={details.bedrooms}
            onChange={handleDetailsChange('bedrooms')}
            fullWidth
            type="number"
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Bathrooms"
            value={details.bathrooms}
            onChange={handleDetailsChange('bathrooms')}
            fullWidth
            type="number"
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Square Feet"
            value={details.squareFeet}
            onChange={handleDetailsChange('squareFeet')}
            fullWidth
            type="number"
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Year Built"
            value={details.yearBuilt}
            onChange={handleDetailsChange('yearBuilt')}
            fullWidth
            type="number"
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            label="Garage Spaces"
            value={details.garageSpaces}
            onChange={handleDetailsChange('garageSpaces')}
            fullWidth
            type="number"
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Overall Quality"
            value={details.overallQuality}
            onChange={handleDetailsChange('overallQuality')}
            fullWidth
            select
            sx={fieldSx}
          >
            {QUALITY_OPTIONS.map((q) => (
              <MenuItem key={q.value} value={q.value}>
                {q.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Annual Taxes (optional)"
            value={details.annualTaxes}
            onChange={handleDetailsChange('annualTaxes')}
            fullWidth
            type="number"
            sx={fieldSx}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => setActiveStep(0)}
          sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={!isStep2Valid}
          onClick={() => setActiveStep(2)}
          sx={goldButtonSx}
        >
          Get My Estimate
        </Button>
      </Box>
    </Box>
  )

  const renderStep3 = () => (
    <Box>
      <Typography variant="h5" fontWeight={600} color="#fff" gutterBottom>
        Enter your info to see your estimate
      </Typography>
      <Typography variant="body1" color="rgba(255,255,255,0.8)" sx={{ mb: 3 }}>
        We just need a few details to show your personalized home value.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Full Name"
            value={contact.name}
            onChange={handleContactChange('name')}
            fullWidth
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Email"
            value={contact.email}
            onChange={handleContactChange('email')}
            fullWidth
            type="email"
            required
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Phone"
            value={contact.phone}
            onChange={handleContactChange('phone')}
            fullWidth
            type="tel"
            required
            sx={fieldSx}
          />
        </Grid>
      </Grid>
      {error && (
        <Typography variant="body2" color="error.light" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => setActiveStep(1)}
          sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={!isStep3Valid || loading}
          onClick={handleSubmitLead}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : undefined
          }
          sx={goldButtonSx}
        >
          {loading ? 'Getting Estimate...' : 'See My Estimate'}
        </Button>
      </Box>
    </Box>
  )

  const renderStep4 = () => {
    if (!result) return null

    const { value, low, high, confidence, history } = result
    const range = high - low || 1
    const markerPercent = ((value - low) / range) * 100
    const mthHistory = history?.mth

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              Estimated Home Value
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              color="primary.main"
              sx={{ mb: 1 }}
            >
              {formatCurrency(value)}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <ConfidenceBadge confidence={confidence} />
            </Box>

            {/* Range bar */}
            <Box sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(low)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(high)}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  height: 12,
                  borderRadius: 6,
                  bgcolor: 'grey.200'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '100%',
                    borderRadius: 6,
                    background:
                      'linear-gradient(90deg, #e3f2fd 0%, #1976d2 50%, #e3f2fd 100%)'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: `${Math.min(Math.max(markerPercent, 2), 98)}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    border: '3px solid white',
                    boxShadow: 2
                  }}
                />
              </Box>
            </Box>

            {/* History chart */}
            {mthHistory && Object.keys(mthHistory).length >= 2 && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  24-Month Value History
                </Typography>
                <HistoryChart history={mthHistory} />
              </Box>
            )}

            {/* CTAs */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
                mt: 4
              }}
            >
              <Button
                variant="contained"
                size="large"
                href="/contact"
                sx={{
                  bgcolor: '#c8a951',
                  '&:hover': { bgcolor: '#b89941' },
                  fontWeight: 600
                }}
              >
                Schedule a Consultation
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={monthlyUpdates}
                  onChange={(e) => setMonthlyUpdates(e.target.checked)}
                />
              }
              label="Get monthly value updates for this property"
              sx={{ mt: 2 }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: 'block', fontStyle: 'italic' }}
            >
              This is a computer-generated estimate and not an appraisal. Actual
              market value may vary.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    )
  }

  // Show results page outside the navy hero
  if (activeStep === 3) {
    return renderStep4()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={800} color="#fff" gutterBottom>
            What&apos;s Your Home Worth?
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.75)">
            Get a free, instant AI-powered estimate
          </Typography>
        </Box>

        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 4,
            '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)' },
            '& .MuiStepLabel-label.Mui-active': { color: '#fff' },
            '& .MuiStepLabel-label.Mui-completed': { color: '#c8a951' },
            '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.3)' },
            '& .MuiStepIcon-root.Mui-active': { color: '#c8a951' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#c8a951' }
          }}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderStep1()}
        {activeStep === 1 && renderStep2()}
        {activeStep === 2 && renderStep3()}
      </Container>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.08)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
    '&.Mui-focused fieldset': { borderColor: '#c8a951' }
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#c8a951' },
  '& .MuiOutlinedInput-input': { color: '#fff' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.6)' }
}

const goldButtonSx = {
  mt: 3,
  bgcolor: '#c8a951',
  color: '#0a1628',
  fontWeight: 700,
  '&:hover': { bgcolor: '#b89941' },
  '&.Mui-disabled': {
    bgcolor: 'rgba(200,169,81,0.3)',
    color: 'rgba(255,255,255,0.4)'
  }
}
