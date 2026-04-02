'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import {
  School as SchoolIcon,
  Park as ParkIcon,
  DirectionsBus as TransitIcon,
  Place as PlaceIcon,
} from '@mui/icons-material'

import { APIPlaces } from 'services/API'
import type { PlacesResponse, PlaceItem } from 'services/API'

interface NearbyPlacesProps {
  lat: number
  lng: number
  address: string
}

const NearbyPlaces: React.FC<NearbyPlacesProps> = ({ lat, lng, address }) => {
  const [data, setData] = useState<PlacesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false)
      return
    }
    let cancelled = false
    APIPlaces.getPlaces(lat, lng).then((res) => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [lat, lng])

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </Paper>
    )
  }

  const schools = data?.schools || []
  const parks = data?.parks || []
  const transit = data?.transit || []

  if (schools.length === 0 && parks.length === 0 && transit.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'school': return <SchoolIcon fontSize="small" />
      case 'park': return <ParkIcon fontSize="small" />
      case 'transit': return <TransitIcon fontSize="small" />
      default: return <PlaceIcon fontSize="small" />
    }
  }

  const renderList = (items: PlaceItem[]) => {
    if (items.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No data available for this category
        </Typography>
      )
    }

    return (
      <List dense>
        {items.map((item, index) => (
          <ListItem key={index} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getIcon(item.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{item.name}</Typography>
                  {item.level && (
                    <Chip label={item.level} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                  )}
                </Box>
              }
              secondary={item.distance}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            {item.rating && (
              <Chip
                label={`${item.rating}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
        ))}
      </List>
    )
  }

  const tabs = [
    { label: 'Schools', items: schools, count: schools.length },
    { label: 'Parks', items: parks, count: parks.length },
    { label: 'Transit', items: transit, count: transit.length },
  ].filter((tab) => tab.count > 0)

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
        {address ? `Schools Near ${address}` : "What's Nearby"}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.label} label={`${tab.label} (${tab.count})`} />
        ))}
      </Tabs>

      <Box>
        {tabs[activeTab] && renderList(tabs[activeTab].items)}
      </Box>
    </Paper>
  )
}

export default NearbyPlaces
