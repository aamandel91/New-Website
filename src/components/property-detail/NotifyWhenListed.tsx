'use client'

import React, { useState } from 'react'

import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'

import { ssIdentify } from '@/utils/suresendTracking'

interface NotifyWhenListedProps {
  propertyAddress: string
}

const NotifyWhenListed: React.FC<NotifyWhenListedProps> = ({
  propertyAddress
}) => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/suresend/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email.split('@')[0],
          email,
          phone: '',
          message: `Notify me when ${propertyAddress} hits the market.`,
          formType: 'contact',
          propertyAddress,
          source: 'property_watcher'
        })
      })

      if (!res.ok) throw new Error('Failed to submit')

      ssIdentify({ email })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Alert severity="success" icon={<NotificationsActiveIcon />}>
          You&apos;ll be notified when {propertyAddress} hits the market.
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <NotificationsActiveIcon color="primary" />
        <Typography variant="h6" component="h2">
          Get Notified When This Home Hits the Market
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        We&apos;ll send you an email as soon as this property is listed for
        sale.
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', gap: 1 }}
      >
        <TextField
          size="small"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          error={!!error}
          helperText={error}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
        >
          {loading ? 'Saving...' : 'Notify Me'}
        </Button>
      </Box>
    </Paper>
  )
}

export default NotifyWhenListed
