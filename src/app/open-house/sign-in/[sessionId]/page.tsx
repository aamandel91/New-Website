'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'

interface SessionData {
  id: string
  propertyAddress: string
  propertyImage: string
  propertyPrice: string
  agentName: string
}

const HEAR_ABOUT_OPTIONS = [
  'Yard Sign',
  'Online',
  'Friend/Family',
  'Drive By',
  'Other'
]

const COUNTDOWN_SECONDS = 5

export default function OpenHouseSignInPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [workingWithAgent, setWorkingWithAgent] = useState('')
  const [hearAbout, setHearAbout] = useState('')
  const [preApproved, setPreApproved] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)

  const resetForm = useCallback(() => {
    setName('')
    setEmail('')
    setPhone('')
    setWorkingWithAgent('')
    setHearAbout('')
    setPreApproved('')
    setSubmitted(false)
    setCountdown(COUNTDOWN_SECONDS)
  }, [])

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/open-house/${sessionId}`)
        if (!res.ok) throw new Error('Open house not found')
        const data = await res.json()
        setSession(data.session)
      } catch {
        setError('This open house sign-in page is no longer available.')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) fetchSession()
  }, [sessionId])

  // Countdown after submit
  useEffect(() => {
    if (!submitted) return

    if (countdown <= 0) {
      resetForm()
      return
    }

    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [submitted, countdown, resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/open-house/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          workingWithAgent,
          hearAbout,
          preApproved
        })
      })

      if (!res.ok) throw new Error('Failed to sign in')
      setSubmitted(true)
    } catch {
      setError('Failed to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', px: 3 }}>
        <Typography variant="h5" color="error" textAlign="center">
          {error}
        </Typography>
      </Box>
    )
  }

  // Thank you screen
  if (submitted) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          px: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
          Thank you for visiting!
        </Typography>
        <Typography variant="h4" color="text.secondary" sx={{ mb: 4 }}>
          Enjoy the open house
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Next visitor in {countdown}s...
        </Typography>
        <Box sx={{ mt: 2 }}>
          <CircularProgress variant="determinate" value={(countdown / COUNTDOWN_SECONDS) * 100} size={48} />
        </Box>
      </Box>
    )
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return price
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#fafafa',
        pb: 4
      }}
    >
      {/* Property header */}
      {session && (
        <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ maxWidth: 600, mx: 'auto', p: 2 }}
          >
            {session.propertyImage && (
              <Box
                component="img"
                src={session.propertyImage}
                alt="Property"
                sx={{
                  width: { xs: 80, sm: 100 },
                  height: { xs: 60, sm: 75 },
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {session.propertyAddress}
              </Typography>
              {session.propertyPrice && (
                <Typography variant="body2" color="primary" fontWeight={600}>
                  {formatPrice(session.propertyPrice)}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Hosted by {session.agentName}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Sign-in form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          px: 3,
          pt: 3
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          sx={{ mb: 3, fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          Welcome! Please sign in.
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            required
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ style: { fontSize: 18 } }}
            InputLabelProps={{ style: { fontSize: 18 } }}
            sx={{ '& .MuiInputBase-root': { minHeight: 56 } }}
          />

          <TextField
            fullWidth
            required
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{ style: { fontSize: 18 } }}
            InputLabelProps={{ style: { fontSize: 18 } }}
            sx={{ '& .MuiInputBase-root': { minHeight: 56 } }}
          />

          <TextField
            fullWidth
            required
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputProps={{ style: { fontSize: 18 } }}
            InputLabelProps={{ style: { fontSize: 18 } }}
            sx={{ '& .MuiInputBase-root': { minHeight: 56 } }}
          />

          <FormControl>
            <FormLabel sx={{ fontSize: 16, fontWeight: 500, mb: 0.5 }}>
              Are you currently working with a real estate agent?
            </FormLabel>
            <RadioGroup
              row
              value={workingWithAgent}
              onChange={(e) => setWorkingWithAgent(e.target.value)}
            >
              <FormControlLabel
                value="yes"
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />}
                label={<Typography sx={{ fontSize: 16 }}>Yes</Typography>}
                sx={{ mr: 4 }}
              />
              <FormControlLabel
                value="no"
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />}
                label={<Typography sx={{ fontSize: 16 }}>No</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: 16 }}>How did you hear about this open house?</InputLabel>
            <Select
              value={hearAbout}
              label="How did you hear about this open house?"
              onChange={(e: SelectChangeEvent) => setHearAbout(e.target.value)}
              sx={{ minHeight: 56, fontSize: 18 }}
            >
              {HEAR_ABOUT_OPTIONS.map((option) => (
                <MenuItem key={option} value={option} sx={{ fontSize: 16 }}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel sx={{ fontSize: 16, fontWeight: 500, mb: 0.5 }}>
              Are you pre-approved for a mortgage?
            </FormLabel>
            <RadioGroup
              row
              value={preApproved}
              onChange={(e) => setPreApproved(e.target.value)}
            >
              <FormControlLabel
                value="yes"
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />}
                label={<Typography sx={{ fontSize: 16 }}>Yes</Typography>}
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="no"
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />}
                label={<Typography sx={{ fontSize: 16 }}>No</Typography>}
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="not_yet"
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />}
                label={<Typography sx={{ fontSize: 16 }}>Not Yet</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!name || !email || !phone || submitting}
            sx={{
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600,
              mt: 1,
              minHeight: 56
            }}
          >
            {submitting ? (
              <CircularProgress size={28} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
