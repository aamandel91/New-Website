'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack,
  Alert,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Dialog,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import HomeIcon from '@mui/icons-material/Home'
import VideocamIcon from '@mui/icons-material/Videocam'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PhoneIcon from '@mui/icons-material/Phone'
import dayjs from 'dayjs'
import { trackFormSubmission } from '@/utils/analytics'
import { isFormBlocked } from '@/utils/formFilter'
import { defaultBlockedWords } from '@/configs/defaults/form-filtering'
import type { ContactFormData } from './PropertyContactForm'

interface Agent {
  name?: string
  phone?: string
  email?: string
  photo?: string
  license?: string
}

interface MobileContactBarProps {
  propertyAddress: string
  agent?: Agent
  onSubmit?: (data: ContactFormData) => Promise<void>
}

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
]

function getDateLabel(date: dayjs.Dayjs, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  return date.format('ddd, MMM D')
}

const MobileContactBar: React.FC<MobileContactBarProps> = ({
  propertyAddress,
  agent,
  onSubmit,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'tour' | 'contact'>('tour')

  // Tour scheduler state
  const [tourType, setTourType] = useState<'inPerson' | 'video'>('inPerson')
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dates = [0, 1, 2, 3, 4].map((offset) => dayjs().add(offset, 'day'))

  const buildTourMessage = (
    dateIndex: number,
    timeSlot: string | null,
    type: 'inPerson' | 'video'
  ): string => {
    const date = dates[dateIndex]
    const dateLabel = getDateLabel(date, dateIndex)
    const tourLabel = type === 'inPerson' ? 'in-person tour' : 'video chat tour'
    if (timeSlot) {
      return `I'd like to schedule a ${tourLabel} for ${propertyAddress} on ${dateLabel} (${date.format('MMM D, YYYY')}) at ${timeSlot}.`
    }
    return `I'm interested in scheduling a ${tourLabel} for ${propertyAddress} on ${dateLabel} (${date.format('MMM D, YYYY')}).`
  }

  const openTourModal = () => {
    setModalMode('tour')
    setSuccess(false)
    setError(null)
    setSelectedDateIndex(0)
    setSelectedTimeSlot(null)
    setTourType('inPerson')
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: buildTourMessage(0, null, 'inPerson'),
    })
    setModalOpen(true)
  }

  const openContactModal = () => {
    setModalMode('contact')
    setSuccess(false)
    setError(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: `I'd like more information about ${propertyAddress}`,
    })
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
  }

  const handleTourTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: 'inPerson' | 'video' | null
  ) => {
    if (newType !== null) {
      setTourType(newType)
      setFormData((prev) => ({
        ...prev,
        message: buildTourMessage(selectedDateIndex, selectedTimeSlot, newType),
      }))
    }
  }

  const handleDateSelect = (index: number) => {
    setSelectedDateIndex(index)
    setFormData((prev) => ({
      ...prev,
      message: buildTourMessage(index, selectedTimeSlot, tourType),
    }))
  }

  const handleSlotClick = (slot: string) => {
    setSelectedTimeSlot(slot)
    setFormData((prev) => ({
      ...prev,
      message: buildTourMessage(selectedDateIndex, slot, tourType),
    }))
  }

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
      trackFormSubmission(formData, modalMode === 'tour' ? 'tour_request' : 'contact')
      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', message: '' })
      setSelectedTimeSlot(null)
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error('Contact form error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Sticky Bottom Bar */}
      <Box
        sx={{
          display: { xs: 'flex', lg: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          bgcolor: 'background.paper',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          px: 2,
          py: 1.5,
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          onClick={openContactModal}
          startIcon={<PhoneIcon />}
          sx={{ py: 1.25, textTransform: 'none', fontWeight: 600 }}
        >
          Contact Agent
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={openTourModal}
          startIcon={<CalendarTodayIcon />}
          sx={{ py: 1.25, textTransform: 'none', fontWeight: 600 }}
        >
          Request Tour
        </Button>
      </Box>

      {/* Full-Screen Modal */}
      <Dialog
        fullScreen
        open={modalOpen}
        onClose={handleClose}
        sx={{ display: { lg: 'none' } }}
      >
        <AppBar sx={{ position: 'relative' }} color="default" elevation={1}>
          <Toolbar>
            <Typography sx={{ flex: 1 }} variant="h6" fontWeight="bold">
              {modalMode === 'tour' ? 'Schedule a Tour' : 'Contact Agent'}
            </Typography>
            <IconButton edge="end" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            px: 2.5,
            py: 3,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <Stack spacing={2.5}>
            {/* Property Address */}
            <Typography variant="body2" color="text.secondary">
              {propertyAddress}
            </Typography>

            {/* Tour Scheduler — only in tour mode */}
            {modalMode === 'tour' && (
              <>
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

                {/* Date Chips — horizontal scrollable */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    pb: 0.5,
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                  }}
                >
                  {dates.map((date, index) => (
                    <Chip
                      key={index}
                      label={getDateLabel(date, index)}
                      onClick={() => handleDateSelect(index)}
                      variant={selectedDateIndex === index ? 'filled' : 'outlined'}
                      color={selectedDateIndex === index ? 'primary' : 'default'}
                      sx={{
                        fontWeight: selectedDateIndex === index ? 700 : 500,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Box>

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
                        borderColor: selectedTimeSlot === slot ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: selectedTimeSlot === slot ? 'primary.main' : 'action.hover',
                        },
                      }}
                    >
                      {slot}
                    </Button>
                  ))}
                </Box>

                <Divider />
              </>
            )}

            {/* Alerts */}
            {success && (
              <Alert severity="success" onClose={() => setSuccess(false)}>
                {modalMode === 'tour'
                  ? 'Tour request sent! We\'ll get back to you soon.'
                  : 'Message sent successfully! We\'ll get back to you soon.'}
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
                  {loading
                    ? 'Sending...'
                    : modalMode === 'tour'
                      ? 'Request Tour'
                      : 'Send Message'}
                </Button>

                <Typography variant="caption" color="text.secondary" textAlign="center">
                  By submitting, you agree to our Terms of Service and Privacy Policy
                </Typography>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Dialog>
    </>
  )
}

export default MobileContactBar
