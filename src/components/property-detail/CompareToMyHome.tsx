'use client'

import React, { useState } from 'react'

import CompareIcon from '@mui/icons-material/CompareArrows'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'

import { ssIdentify } from 'utils/suresendTracking'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompareToMyHomeProps {
  listPrice: number
  beds: number
  baths: number
  sqft: number
  propertyType?: string
}

interface FormValues {
  streetAddress: string
  city: string
  zipCode: string
  bedrooms: string
  bathrooms: string
  squareFeet: string
  propertyType: string
  yearBuilt: string
}

interface EstimateResult {
  estimatedValue: number
  low: number
  high: number
  confidence: number
}

const PROPERTY_TYPES = ['Detached', 'Condo', 'Townhouse'] as const

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

const INITIAL_FORM: FormValues = {
  streetAddress: '',
  city: '',
  zipCode: '',
  bedrooms: '',
  bathrooms: '',
  squareFeet: '',
  propertyType: 'Detached',
  yearBuilt: ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CompareToMyHome: React.FC<CompareToMyHomeProps> = ({
  listPrice,
  beds,
  baths,
  sqft,
  propertyType
}) => {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<FormValues>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EstimateResult | null>(null)

  // Lead capture
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  const handleChange =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const isFormValid =
    form.streetAddress.trim() !== '' &&
    form.city.trim() !== '' &&
    form.zipCode.trim() !== '' &&
    form.bedrooms.trim() !== '' &&
    form.bathrooms.trim() !== '' &&
    form.squareFeet.trim() !== ''

  const handleCompare = async () => {
    if (!isFormValid) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streetAddress: form.streetAddress,
          city: form.city,
          zipCode: form.zipCode,
          bedrooms: parseInt(form.bedrooms),
          bathrooms: parseInt(form.bathrooms),
          squareFeet: parseInt(form.squareFeet),
          propertyType: form.propertyType,
          yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined
        })
      })

      if (!res.ok) {
        throw new Error('Unable to generate estimate')
      }

      const data = await res.json()
      setResult({
        estimatedValue: data.estimatedValue ?? data.value ?? 0,
        low: data.low ?? 0,
        high: data.high ?? 0,
        confidence: data.confidence ?? 0
      })
    } catch {
      setError(
        'Unable to generate an estimate for this address. Please check the details and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async () => {
    if (!email.trim()) return
    setEmailLoading(true)
    try {
      ssIdentify({ email: email.trim() })

      await fetch('/api/suresend/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email.trim().split('@')[0],
          email: email.trim(),
          phone: '',
          message: `Compare tool used for ${form.streetAddress}, ${form.city} ${form.zipCode}`,
          formType: 'contact',
          source: 'compare_tool',
          tags: 'seller_lead,compare_tool'
        })
      })

      setEmailSubmitted(true)
    } catch {
      setEmailSubmitted(true)
    } finally {
      setEmailLoading(false)
    }
  }

  const userSqft = parseInt(form.squareFeet) || 0
  const userPricePerSqft =
    result && userSqft > 0 ? Math.round(result.estimatedValue / userSqft) : 0
  const listingPricePerSqft = sqft > 0 ? Math.round(listPrice / sqft) : 0
  const priceDifference = result ? listPrice - result.estimatedValue : 0

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: expanded ? 2 : undefined }}>
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Compare to My Home
            </Typography>
          </Box>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {!result && (
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Enter your home details to see how it compares to this
                  listing.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Street Address"
                      value={form.streetAddress}
                      onChange={handleChange('streetAddress')}
                      fullWidth
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="City"
                      value={form.city}
                      onChange={handleChange('city')}
                      fullWidth
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Zip Code"
                      value={form.zipCode}
                      onChange={handleChange('zipCode')}
                      fullWidth
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Bedrooms"
                      value={form.bedrooms}
                      onChange={handleChange('bedrooms')}
                      fullWidth
                      size="small"
                      type="number"
                      required
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Bathrooms"
                      value={form.bathrooms}
                      onChange={handleChange('bathrooms')}
                      fullWidth
                      size="small"
                      type="number"
                      required
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Square Feet"
                      value={form.squareFeet}
                      onChange={handleChange('squareFeet')}
                      fullWidth
                      size="small"
                      type="number"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Property Type"
                      value={form.propertyType}
                      onChange={handleChange('propertyType')}
                      fullWidth
                      size="small"
                      select
                    >
                      {PROPERTY_TYPES.map((pt) => (
                        <MenuItem key={pt} value={pt}>
                          {pt}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Year Built (optional)"
                      value={form.yearBuilt}
                      onChange={handleChange('yearBuilt')}
                      fullWidth
                      size="small"
                      type="number"
                    />
                  </Grid>
                </Grid>

                {error && (
                  <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                  </Typography>
                )}

                <Button
                  variant="contained"
                  onClick={handleCompare}
                  disabled={!isFormValid || loading}
                  sx={{ mt: 2 }}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <CompareIcon />
                    )
                  }
                >
                  {loading ? 'Estimating...' : 'Compare'}
                </Button>
              </Box>
            )}

            {result && (
              <Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Card
                      variant="outlined"
                      sx={{ height: '100%', bgcolor: 'grey.50' }}
                    >
                      <CardContent>
                        <Typography variant="overline" color="text.secondary">
                          Your Home
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {formatCurrency(result.estimatedValue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (estimated)
                        </Typography>
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2">
                            {form.bedrooms} bed / {form.bathrooms} bath
                          </Typography>
                          <Typography variant="body2">
                            {parseInt(form.squareFeet).toLocaleString()} sqft
                          </Typography>
                          {userPricePerSqft > 0 && (
                            <Typography variant="body2">
                              {formatCurrency(userPricePerSqft)}/sqft
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card
                      variant="outlined"
                      sx={{ height: '100%', bgcolor: 'grey.50' }}
                    >
                      <CardContent>
                        <Typography variant="overline" color="text.secondary">
                          This Listing
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {formatCurrency(listPrice)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (listed)
                        </Typography>
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2">
                            {beds} bed / {baths} bath
                          </Typography>
                          <Typography variant="body2">
                            {sqft.toLocaleString()} sqft
                          </Typography>
                          {listingPricePerSqft > 0 && (
                            <Typography variant="body2">
                              {formatCurrency(listingPricePerSqft)}/sqft
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor:
                      priceDifference > 0 ? 'success.light' : 'error.light',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Difference: {priceDifference >= 0 ? '+' : ''}
                    {formatCurrency(priceDifference)}
                  </Typography>
                </Box>

                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setResult(null)
                    setError(null)
                    setEmailSubmitted(false)
                    setEmail('')
                  }}
                  sx={{ mt: 1 }}
                >
                  Compare another home
                </Button>

                {!emailSubmitted && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Want a detailed market analysis?
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start'
                      }}
                    >
                      <TextField
                        label="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        size="small"
                        type="email"
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleEmailSubmit}
                        disabled={!email.trim() || emailLoading}
                        size="medium"
                      >
                        {emailLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'Submit'
                        )}
                      </Button>
                    </Box>
                  </Box>
                )}

                {emailSubmitted && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                      variant="body2"
                      color="success.main"
                      fontWeight={600}
                    >
                      Thanks! We&apos;ll send you a detailed market analysis
                      soon.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default CompareToMyHome
