'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  CircularProgress,
  Stack,
  Link as MuiLink,
} from '@mui/material'
import Link from 'next/link'

interface OpenHouseFormProps {
  propertyMls: string
  propertyAddress: string
  autoReloadSeconds?: number
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  buyingTimeline: string
  hasAgent: boolean
  agentName: string
  wantsMarketUpdates: boolean
  wantsPropertyUpdates: boolean
}

const OpenHouseForm: React.FC<OpenHouseFormProps> = ({
  propertyMls,
  propertyAddress,
  autoReloadSeconds = 30,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    buyingTimeline: '',
    hasAgent: false,
    agentName: '',
    wantsMarketUpdates: true,
    wantsPropertyUpdates: true,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)

  // Load reCAPTCHA script
  useEffect(() => {
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

    if (!recaptchaKey) {
      console.warn('reCAPTCHA site key not configured')
      setRecaptchaLoaded(true) // Allow form to work without reCAPTCHA in development
      return
    }

    // Load reCAPTCHA script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`
    script.async = true
    script.defer = true
    script.onload = () => setRecaptchaLoaded(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Auto-reload countdown
  useEffect(() => {
    if (success && autoReloadSeconds > 0) {
      setCountdown(autoReloadSeconds)
    }
  }, [success, autoReloadSeconds])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      window.location.reload()
    }
  }, [countdown])

  const handleChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.buyingTimeline) {
      setError('Please select your buying timeline')
      return false
    }
    if (formData.hasAgent && !formData.agentName.trim()) {
      setError('Please enter your agent\'s name')
      return false
    }
    return true
  }

  const getRecaptchaToken = async (): Promise<string | null> => {
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

    if (!recaptchaKey || !window.grecaptcha) {
      return null // Allow submission without reCAPTCHA in development
    }

    try {
      const token = await window.grecaptcha.execute(recaptchaKey, { action: 'openhouse_signin' })
      return token
    } catch (err) {
      console.error('reCAPTCHA error:', err)
      return null
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken()

      // Submit form data
      const response = await fetch('/api/open-house/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          propertyMls,
          propertyAddress,
          recaptchaToken,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit form' }))
        throw new Error(errorData.message || 'Failed to submit form')
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Thank you for signing in!
          </Typography>
          <Typography variant="body2">
            We've received your information and one of our agents will be in touch with you shortly.
          </Typography>
        </Alert>

        {countdown !== null && countdown > 0 && (
          <Typography variant="body2" color="text.secondary">
            This page will refresh in {countdown} seconds...
          </Typography>
        )}

        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Sign In Another Guest
        </Button>
      </Paper>
    )
  }

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Open House Sign-In
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide your information to receive updates about this property and the local market.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {/* Name Fields */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              required
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              disabled={loading}
            />
            <TextField
              required
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              disabled={loading}
            />
          </Stack>

          {/* Contact Fields */}
          <TextField
            required
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={loading}
          />

          <TextField
            required
            fullWidth
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            disabled={loading}
            placeholder="(123) 456-7890"
          />

          {/* Buying Timeline */}
          <FormControl fullWidth required disabled={loading}>
            <InputLabel>How soon are you looking to buy?</InputLabel>
            <Select
              value={formData.buyingTimeline}
              onChange={handleChange('buyingTimeline')}
              label="How soon are you looking to buy?"
            >
              <MenuItem value="immediately">Immediately (0-3 months)</MenuItem>
              <MenuItem value="soon">Soon (3-6 months)</MenuItem>
              <MenuItem value="exploring">Exploring (6-12 months)</MenuItem>
              <MenuItem value="planning">Planning (12+ months)</MenuItem>
              <MenuItem value="just_looking">Just Looking</MenuItem>
            </Select>
          </FormControl>

          {/* Agent Status */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.hasAgent}
                  onChange={handleChange('hasAgent')}
                  disabled={loading}
                />
              }
              label="I am currently working with a real estate agent"
            />

            {formData.hasAgent && (
              <TextField
                fullWidth
                label="Agent's Name"
                value={formData.agentName}
                onChange={handleChange('agentName')}
                disabled={loading}
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* Preferences */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Communication Preferences
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.wantsMarketUpdates}
                  onChange={handleChange('wantsMarketUpdates')}
                  disabled={loading}
                />
              }
              label="Send me local market updates and new listings"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.wantsPropertyUpdates}
                  onChange={handleChange('wantsPropertyUpdates')}
                  disabled={loading}
                />
              }
              label="Notify me when this property's status changes"
            />
          </Box>

          {/* Consent Language */}
          <Typography variant="caption" color="text.secondary">
            By signing in, you agree to receive calls, texts, and emails about your real estate
            interests. Message and data rates may apply. You can opt out at any time. View our{' '}
            <Link href="/terms" passHref legacyBehavior>
              <MuiLink>Terms of Service</MuiLink>
            </Link>{' '}
            and{' '}
            <Link href="/privacy" passHref legacyBehavior>
              <MuiLink>Privacy Policy</MuiLink>
            </Link>
            .
          </Typography>

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || !recaptchaLoaded}
            sx={{ py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* reCAPTCHA Badge Notice */}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            This site is protected by reCAPTCHA and the Google{' '}
            <MuiLink
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </MuiLink>{' '}
            and{' '}
            <MuiLink
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </MuiLink>{' '}
            apply.
          </Typography>
        </Stack>
      </Box>
    </Paper>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    grecaptcha: any
  }
}

export default OpenHouseForm
