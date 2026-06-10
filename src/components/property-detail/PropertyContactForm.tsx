'use client'

import React, { useState } from 'react'
import dayjs from 'dayjs'

import HomeIcon from '@mui/icons-material/Home'
import SendIcon from '@mui/icons-material/Send'
import VideocamIcon from '@mui/icons-material/Videocam'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'

import { defaultBlockedWords } from '@/configs/defaults/form-filtering'
import { trackFormSubmission } from '@/utils/analytics'
import { isFormBlocked } from '@/utils/formFilter'
import { ssIdentify } from '@/utils/suresendTracking'

interface Agent {
  name?: string
  phone?: string
  email?: string
  photo?: string
  license?: string
}

interface PropertyContactFormProps {
  propertyAddress: string
  mlsNumber?: string
  agent?: Agent
  onSubmit?: (data: ContactFormData) => Promise<void>
}

export interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
}

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM'
]

function getDateLabel(date: dayjs.Dayjs, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  return date.format('ddd, MMM D')
}

function sendToSureSend(
  data: ContactFormData,
  formType: string,
  propertyAddress?: string,
  mlsNumber?: string
) {
  fetch('/api/suresend/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      formType,
      propertyAddress,
      mlsNumber,
      source: 'property_detail_page'
    })
  }).catch((err) => console.error('[SureSend] Lead sync failed:', err))
}

const PropertyContactForm: React.FC<PropertyContactFormProps> = ({
  propertyAddress,
  mlsNumber,
  agent,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: `I'm interested in scheduling a tour for ${propertyAddress}`
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tour scheduler state
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [tourType, setTourType] = useState<'inPerson' | 'video'>('inPerson')

  const dates = [0, 1, 2].map((offset) => dayjs().add(offset, 'day'))

  const handleTourTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: 'inPerson' | 'video' | null
  ) => {
    if (newType !== null) {
      setTourType(newType)
      updateMessage(selectedDateIndex, selectedTimeSlot, newType)
    }
  }

  const handleDateSelect = (index: number) => {
    setSelectedDateIndex(index)
    updateMessage(index, selectedTimeSlot, tourType)
  }

  const handleSlotClick = (slot: string) => {
    setSelectedTimeSlot(slot)
    updateMessage(selectedDateIndex, slot, tourType)
  }

  const updateMessage = (
    dateIndex: number,
    timeSlot: string | null,
    type: 'inPerson' | 'video'
  ) => {
    const date = dates[dateIndex]
    const dateLabel = getDateLabel(date, dateIndex)
    const tourLabel = type === 'inPerson' ? 'in-person tour' : 'video chat tour'

    if (timeSlot) {
      setFormData((prev) => ({
        ...prev,
        message: `I'd like to schedule a ${tourLabel} for ${propertyAddress} on ${dateLabel} (${date.format('MMM D, YYYY')}) at ${timeSlot}.`
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        message: `I'm interested in scheduling a ${tourLabel} for ${propertyAddress} on ${dateLabel} (${date.format('MMM D, YYYY')}).`
      }))
    }
  }

  const handleChange =
    (field: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value
      }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const filterResult = isFormBlocked(formData, defaultBlockedWords)
    if (filterResult.blocked) {
      setError('Unable to submit form. Please remove prohibited content.')
      setLoading(false)
      return
    }

    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
      trackFormSubmission(formData, 'tour_request')
      ssIdentify({
        email: formData.email,
        name: formData.name,
        phone: formData.phone
      })
      // Fire-and-forget: sync lead to SureSend CRM in parallel
      sendToSureSend(formData, 'tour_request', propertyAddress, mlsNumber)
      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `I'm interested in scheduling a tour for ${propertyAddress}`
      })
      setSelectedTimeSlot(null)
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error('Contact form error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      id="contact-form"
      elevation={3}
      sx={{
        p: 3,
        bgcolor: 'background.paper'
      }}
    >
      <Stack spacing={2.5}>
        {/* Header */}
        <Typography variant="h6" component="h3" fontWeight="bold">
          {propertyAddress
            ? `Interested in ${propertyAddress}?`
            : 'Schedule a Tour'}
        </Typography>

        {/* Tour Type Toggle */}
        <ToggleButtonGroup
          value={tourType}
          exclusive
          onChange={handleTourTypeChange}
          size="small"
          fullWidth
        >
          <ToggleButton
            value="inPerson"
            sx={{ textTransform: 'none', fontWeight: 600, py: 0.75 }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
            In Person
          </ToggleButton>
          <ToggleButton
            value="video"
            sx={{ textTransform: 'none', fontWeight: 600, py: 0.75 }}
          >
            <VideocamIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
            Video Chat
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Date Chips */}
        <Stack direction="row" spacing={1}>
          {dates.map((date, index) => (
            <Chip
              key={index}
              label={getDateLabel(date, index)}
              onClick={() => handleDateSelect(index)}
              variant={selectedDateIndex === index ? 'filled' : 'outlined'}
              color={selectedDateIndex === index ? 'primary' : 'default'}
              sx={{
                fontWeight: selectedDateIndex === index ? 700 : 500,
                flex: 1
              }}
            />
          ))}
        </Stack>

        {/* Time Slots */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {TIME_SLOTS.map((slot) => (
            <Button
              key={slot}
              variant={selectedTimeSlot === slot ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleSlotClick(slot)}
              sx={{
                textTransform: 'none',
                flex: '1 1 calc(25% - 6px)',
                minWidth: 0,
                fontWeight: selectedTimeSlot === slot ? 700 : 500,
                fontSize: '0.8rem',
                py: 0.75,
                borderColor:
                  selectedTimeSlot === slot ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor:
                    selectedTimeSlot === slot ? 'primary.main' : 'action.hover'
                }
              }}
            >
              {slot}
            </Button>
          ))}
        </Box>

        <Divider />

        {/* Agent Info */}
        {agent && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={agent.photo}
              alt={agent.name}
              sx={{ width: 48, height: 48 }}
            >
              {agent.name?.[0]}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {agent.name || 'Agent'}
              </Typography>
              {agent.phone && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {agent.phone}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Message sent successfully! We&apos;ll get back to you soon.
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Contact Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={1.5}>
            <TextField
              label="Full Name"
              required
              fullWidth
              size="small"
              value={formData.name}
              onChange={handleChange('name')}
              disabled={loading}
            />

            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              size="small"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={loading}
            />

            <TextField
              label="Phone Number"
              type="tel"
              required
              fullWidth
              size="small"
              value={formData.phone}
              onChange={handleChange('phone')}
              disabled={loading}
              placeholder="(555) 555-1234"
            />

            <TextField
              label="Message"
              multiline
              rows={3}
              required
              fullWidth
              size="small"
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
              {loading ? 'Sending...' : 'Request Tour'}
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              By submitting, you agree to our Terms of Service and Privacy
              Policy
            </Typography>
          </Stack>
        </form>
      </Stack>
    </Paper>
  )
}

export default PropertyContactForm
