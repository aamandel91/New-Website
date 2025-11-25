'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Link,
} from '@mui/material'
import {
  School as SchoolIcon,
  ShoppingCart as ShoppingIcon,
  Restaurant as RestaurantIcon,
  LocalHospital as HospitalIcon,
  DirectionsBus as TransitIcon,
  Park as ParkIcon,
  Place as PlaceIcon,
} from '@mui/icons-material'

interface Coordinates {
  latitude: number
  longitude: number
}

interface NearbyPlace {
  name: string
  type: 'school' | 'shopping' | 'restaurant' | 'hospital' | 'transit' | 'park' | 'other'
  distance?: string
  rating?: number
}

interface PropertyLocationProps {
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  coordinates: Coordinates
  neighborhood?: string
  county?: string
  schoolDistrict?: string
  nearbyPlaces?: NearbyPlace[]
  walkscore?: number
  transitscore?: number
  bikescore?: number
}

const PropertyLocation: React.FC<PropertyLocationProps> = ({
  address,
  coordinates,
  neighborhood,
  county,
  schoolDistrict,
  nearbyPlaces = [],
  walkscore,
  transitscore,
  bikescore,
}) => {
  const [activeTab, setActiveTab] = useState(0)

  const fullAddress = [address.street, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(', ')

  // Google Maps embed URL
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  }&q=${coordinates.latitude},${coordinates.longitude}&zoom=15`

  // Google Maps link
  const mapLinkUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`

  // Street View URL
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.latitude},${coordinates.longitude}`

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'school':
        return <SchoolIcon />
      case 'shopping':
        return <ShoppingIcon />
      case 'restaurant':
        return <RestaurantIcon />
      case 'hospital':
        return <HospitalIcon />
      case 'transit':
        return <TransitIcon />
      case 'park':
        return <ParkIcon />
      default:
        return <PlaceIcon />
    }
  }

  const categorizeNearbyPlaces = () => {
    const categories = {
      schools: nearbyPlaces.filter((p) => p.type === 'school'),
      shopping: nearbyPlaces.filter((p) => p.type === 'shopping'),
      dining: nearbyPlaces.filter((p) => p.type === 'restaurant'),
      parks: nearbyPlaces.filter((p) => p.type === 'park'),
      transit: nearbyPlaces.filter((p) => p.type === 'transit'),
      healthcare: nearbyPlaces.filter((p) => p.type === 'hospital'),
    }
    return categories
  }

  const categories = categorizeNearbyPlaces()

  const renderNearbyList = (places: NearbyPlace[]) => {
    if (places.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No nearby places found in this category
        </Typography>
      )
    }

    return (
      <List dense>
        {places.map((place, index) => (
          <ListItem key={index} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getPlaceIcon(place.type)}
            </ListItemIcon>
            <ListItemText
              primary={place.name}
              secondary={place.distance}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            {place.rating && (
              <Chip
                label={`★ ${place.rating}`}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
        ))}
      </List>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Location
      </Typography>

      {/* Address & Neighborhood Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          {fullAddress}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {neighborhood && (
            <Chip label={`Neighborhood: ${neighborhood}`} size="small" />
          )}
          {county && <Chip label={`County: ${county}`} size="small" />}
          {schoolDistrict && (
            <Chip label={`School District: ${schoolDistrict}`} size="small" />
          )}
        </Box>
      </Box>

      {/* Map Embed */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 400,
          mb: 3,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Property location map"
        />
      </Box>

      {/* Map Links */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Link
          href={mapLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <PlaceIcon fontSize="small" />
          View on Google Maps
        </Link>
        <Link
          href={streetViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
        >
          Street View
        </Link>
      </Box>

      {/* Walk Score, Transit Score, Bike Score */}
      {(walkscore || transitscore || bikescore) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {walkscore && (
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}
              >
                <Typography variant="h4" color="primary">
                  {walkscore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Walk Score®
                </Typography>
              </Paper>
            </Grid>
          )}
          {transitscore && (
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}
              >
                <Typography variant="h4" color="primary">
                  {transitscore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transit Score®
                </Typography>
              </Paper>
            </Grid>
          )}
          {bikescore && (
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}
              >
                <Typography variant="h4" color="primary">
                  {bikescore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bike Score®
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Nearby Places */}
      {nearbyPlaces.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            What's Nearby
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label={`Schools (${categories.schools.length})`} />
            <Tab label={`Shopping (${categories.shopping.length})`} />
            <Tab label={`Dining (${categories.dining.length})`} />
            <Tab label={`Parks (${categories.parks.length})`} />
            <Tab label={`Transit (${categories.transit.length})`} />
            <Tab label={`Healthcare (${categories.healthcare.length})`} />
          </Tabs>

          <Box>
            {activeTab === 0 && renderNearbyList(categories.schools)}
            {activeTab === 1 && renderNearbyList(categories.shopping)}
            {activeTab === 2 && renderNearbyList(categories.dining)}
            {activeTab === 3 && renderNearbyList(categories.parks)}
            {activeTab === 4 && renderNearbyList(categories.transit)}
            {activeTab === 5 && renderNearbyList(categories.healthcare)}
          </Box>
        </>
      )}

      {/* Coordinates (for reference) */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Coordinates: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
      </Typography>
    </Paper>
  )
}

export default PropertyLocation
