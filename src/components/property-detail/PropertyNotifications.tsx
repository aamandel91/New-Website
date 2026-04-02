'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { ssIdentify } from '@/utils/suresendTracking'
import useSnackbar from '@/hooks/useSnackbar'

interface PropertyNotificationsProps {
  propertyAddress: string
  mlsNumber: string
  city: string
  neighborhood?: string
}

type ToggleKey = 'property_watcher' | 'new_listing' | 'sold_alert' | 'expired_alert'

const STORAGE_KEY = 'property_notifications'

function getStorageState(): Record<string, Record<ToggleKey, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setStorageState(key: string, toggles: Record<ToggleKey, boolean>) {
  try {
    const state = getStorageState()
    state[key] = toggles
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable
  }
}

const PropertyNotifications: React.FC<PropertyNotificationsProps> = ({
  propertyAddress,
  mlsNumber,
  city,
  neighborhood,
}) => {
  const { showSnackbar } = useSnackbar()
  const locationLabel = neighborhood || city
  const storageKey = mlsNumber

  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    property_watcher: false,
    new_listing: false,
    sold_alert: false,
    expired_alert: false,
  })
  const [activeToggle, setActiveToggle] = useState<ToggleKey | null>(null)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load persisted toggle state
  useEffect(() => {
    const stored = getStorageState()[storageKey]
    if (stored) {
      setToggles(stored)
    }
  }, [storageKey])

  const handleToggle = useCallback(
    (key: ToggleKey) => {
      const newValue = !toggles[key]
      if (newValue) {
        // Turning on — show email form
        setActiveToggle(key)
      } else {
        // Turning off — just update state
        const updated = { ...toggles, [key]: false }
        setToggles(updated)
        setStorageState(storageKey, updated)
        setActiveToggle(null)
      }
    },
    [toggles, storageKey],
  )

  const getTagForToggle = (key: ToggleKey): string => {
    const citySlug = city.toLowerCase().replace(/\s+/g, '_')
    switch (key) {
      case 'property_watcher':
        return 'property_watcher'
      case 'new_listing':
        return `new_listing_alert_${citySlug}`
      case 'sold_alert':
        return `sold_alert_${citySlug}`
      case 'expired_alert':
        return `expired_alert_${citySlug}`
    }
  }

  const handleSubscribe = async () => {
    if (!activeToggle || !email) return
    setSubmitting(true)

    try {
      const tag = getTagForToggle(activeToggle)
      await fetch('/api/suresend/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: '',
          formType: 'contact',
          propertyAddress,
          mlsNumber,
          source: `notification_${activeToggle}`,
          tags: [tag],
        }),
      })

      ssIdentify({ email })

      const updated = { ...toggles, [activeToggle]: true }
      setToggles(updated)
      setStorageState(storageKey, updated)
      setActiveToggle(null)
      setEmail('')
      showSnackbar('You\'re subscribed! We\'ll notify you of updates.', 'success', 3000)
    } catch {
      showSnackbar('Something went wrong. Please try again.', 'error', 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleItems: { key: ToggleKey; label: string }[] = [
    { key: 'property_watcher', label: 'Watch This Property' },
    { key: 'new_listing', label: `New Listings in ${locationLabel}` },
    { key: 'sold_alert', label: `Sold Listings in ${locationLabel}` },
    { key: 'expired_alert', label: `Expired Listings in ${locationLabel}` },
  ]

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <NotificationsActiveIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            Property Alerts
          </Typography>
        </Box>

        {toggleItems.map(({ key, label }) => (
          <Box key={key}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.75,
              }}
            >
              <Typography variant="body2" sx={{ pr: 1 }}>
                {label}
              </Typography>
              <Switch
                size="small"
                checked={toggles[key]}
                onChange={() => handleToggle(key)}
              />
            </Box>

            {/* Inline email form when toggling on */}
            {activeToggle === key && !toggles[key] && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  pb: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                <TextField
                  size="small"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubscribe()
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSubscribe}
                  disabled={submitting || !email}
                  sx={{ minWidth: 90, height: 40 }}
                >
                  {submitting ? <CircularProgress size={20} /> : 'Subscribe'}
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

export default PropertyNotifications
