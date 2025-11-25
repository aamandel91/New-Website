'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Stack,
  Alert,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

interface Agent {
  name?: string
  phone?: string
  email?: string
  photo?: string
  license?: string
}

interface PropertyContactFormProps {
  propertyAddress: string
  agent?: Agent
  onSubmit?: (data: ContactFormData) => Promise<void>
}

export interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
}

const PropertyContactForm: React.FC<PropertyContactFormProps> = ({
  propertyAddress,
  agent,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: `I am interested in ${propertyAddress}`,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
      setSuccess(true)
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `I am interested in ${propertyAddress}`,
      })
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error('Contact form error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: { md: 'sticky' },
        top: { md: 96 }, // 24px * 4 = 96px from top
        p: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={3}>
        {/* Agent Info */}
        {agent && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Avatar
                src={agent.photo}
                alt={agent.name}
                sx={{ width: 60, height: 60 }}
              >
                {agent.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {agent.name || 'Agent'}
                </Typography>
                {agent.license && (
                  <Typography variant="caption" color="text.secondary">
                    License #{agent.license}
                  </Typography>
                )}
              </Box>
            </Stack>

            {agent.phone && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Phone: {agent.phone}
              </Typography>
            )}
            {agent.email && (
              <Typography variant="body2" color="text.secondary">
                Email: {agent.email}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="h6" fontWeight="bold">
          Contact Agent
        </Typography>

        {success && (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Message sent successfully! We'll get back to you soon.
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Contact Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              required
              fullWidth
              value={formData.name}
              onChange={handleChange('name')}
              disabled={loading}
            />

            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={formData.email}
              onChange={handleChange('email')}
              disabled={loading}
            />

            <TextField
              label="Phone Number"
              type="tel"
              required
              fullWidth
              value={formData.phone}
              onChange={handleChange('phone')}
              disabled={loading}
              placeholder="(555) 555-1234"
            />

            <TextField
              label="Message"
              multiline
              rows={4}
              required
              fullWidth
              value={formData.message}
              onChange={handleChange('message')}
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              endIcon={<SendIcon />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              By submitting, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Stack>
        </form>
      </Stack>
    </Paper>
  )
}

export default PropertyContactForm
