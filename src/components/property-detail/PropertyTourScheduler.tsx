'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import VideocamIcon from '@mui/icons-material/Videocam'
import dayjs from 'dayjs'

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

const PropertyTourScheduler: React.FC = () => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [tourType, setTourType] = useState<'inPerson' | 'video'>('inPerson')

  const dates = [0, 1, 2].map((offset) => dayjs().add(offset, 'day'))

  const handleTourTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: 'inPerson' | 'video' | null
  ) => {
    if (newType !== null) {
      setTourType(newType)
    }
  }

  const handleSlotClick = () => {
    const contactForm = document.getElementById('contact-form')
    contactForm?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Schedule a Tour
      </Typography>

      {/* Tour Type Toggle */}
      <ToggleButtonGroup
        value={tourType}
        exclusive
        onChange={handleTourTypeChange}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      >
        <ToggleButton value="inPerson" sx={{ textTransform: 'none', fontWeight: 600 }}>
          <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
          In Person
        </ToggleButton>
        <ToggleButton value="video" sx={{ textTransform: 'none', fontWeight: 600 }}>
          <VideocamIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
          Video Chat
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Date Chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {dates.map((date, index) => (
          <Chip
            key={index}
            label={getDateLabel(date, index)}
            onClick={() => setSelectedDateIndex(index)}
            variant={selectedDateIndex === index ? 'filled' : 'outlined'}
            color={selectedDateIndex === index ? 'primary' : 'default'}
            sx={{ fontWeight: selectedDateIndex === index ? 700 : 500 }}
          />
        ))}
      </Stack>

      {/* Time Slots */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {TIME_SLOTS.map((slot) => (
          <Button
            key={slot}
            variant="outlined"
            size="small"
            onClick={handleSlotClick}
            sx={{
              textTransform: 'none',
              minWidth: 80,
              fontWeight: 500,
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              },
            }}
          >
            {slot}
          </Button>
        ))}
      </Box>
    </Paper>
  )
}

export default PropertyTourScheduler
