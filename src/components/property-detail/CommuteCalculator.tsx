'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Divider,
} from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit'
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'

interface CommuteCalculatorProps {
  originAddress: string
  originLat: number
  originLng: number
}

type TravelMode = 'driving' | 'transit' | 'walking' | 'cycling'

interface CommuteResult {
  duration: number // minutes
  distance: number // miles
  mode: TravelMode
}

interface GeocodingSuggestion {
  place_name: string
  center: [number, number] // [lng, lat]
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_KEY || ''

const MODE_LABELS: Record<TravelMode, string> = {
  driving: 'Drive',
  transit: 'Transit',
  walking: 'Walk',
  cycling: 'Bike',
}

const MODE_ICONS: Record<TravelMode, React.ReactNode> = {
  driving: <DirectionsCarIcon />,
  transit: <DirectionsTransitIcon />,
  walking: <DirectionsWalkIcon />,
  cycling: <DirectionsBikeIcon />,
}

const CommuteCalculator: React.FC<CommuteCalculatorProps> = ({
  originAddress,
  originLat,
  originLng,
}) => {
  const [destination, setDestination] = useState('')
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [travelMode, setTravelMode] = useState<TravelMode>('driving')
  const [result, setResult] = useState<CommuteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    try {
      const encoded = encodeURIComponent(query)
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=5`
      )
      if (!resp.ok) return
      const data = await resp.json()
      setSuggestions(
        (data.features || []).map((f: { place_name: string; center: [number, number] }) => ({
          place_name: f.place_name,
          center: f.center,
        }))
      )
      setShowSuggestions(true)
    } catch {
      // Silently fail geocoding suggestions
    }
  }, [])

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDestination(val)
    setDestinationCoords(null)
    setResult(null)
    setError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const selectSuggestion = (suggestion: GeocodingSuggestion) => {
    setDestination(suggestion.place_name)
    setDestinationCoords(suggestion.center)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleModeChange = (_e: React.MouseEvent<HTMLElement>, newMode: TravelMode | null) => {
    if (newMode) {
      setTravelMode(newMode)
      setResult(null)
    }
  }

  const calculateCommute = async () => {
    if (travelMode === 'transit') {
      setError(
        'Transit directions are not available via Mapbox. Try Google Maps for transit routes.'
      )
      setResult(null)
      return
    }

    let destLng: number
    let destLat: number

    if (destinationCoords) {
      ;[destLng, destLat] = destinationCoords
    } else if (destination.length >= 3) {
      // Geocode the destination first
      try {
        const encoded = encodeURIComponent(destination)
        const resp = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`
        )
        if (!resp.ok) {
          setError('Could not find that destination. Try a different address.')
          return
        }
        const data = await resp.json()
        if (!data.features || data.features.length === 0) {
          setError('No results found for that address.')
          return
        }
        ;[destLng, destLat] = data.features[0].center
      } catch {
        setError('Failed to geocode destination. Please try again.')
        return
      }
    } else {
      setError('Please enter a destination address.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const profile = travelMode === 'driving' ? 'driving' : travelMode
      const coords = `${originLng},${originLat};${destLng},${destLat}`
      const resp = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?access_token=${MAPBOX_TOKEN}&overview=false`
      )

      if (!resp.ok) {
        setError('Could not calculate route. Try a different address or mode.')
        return
      }

      const data = await resp.json()
      if (!data.routes || data.routes.length === 0) {
        setError('No route found between these locations.')
        return
      }

      const route = data.routes[0]
      setResult({
        duration: Math.round(route.duration / 60),
        distance: Math.round((route.distance / 1609.34) * 10) / 10,
        mode: travelMode,
      })
    } catch {
      setError('Failed to calculate commute. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mt: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Calculate Commute
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        From {originAddress}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        {/* Destination input with autocomplete */}
        <Box sx={{ position: 'relative' }} ref={suggestionsRef}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Destination
          </Typography>
          <TextField
            value={destination}
            onChange={handleDestinationChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Enter work address, school, etc."
            fullWidth
            size="small"
          />
          {showSuggestions && suggestions.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {suggestions.map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                  onClick={() => selectSuggestion(s)}
                >
                  <Typography variant="body2">{s.place_name}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Travel mode selector */}
        <Box>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Travel Mode
          </Typography>
          <ToggleButtonGroup
            value={travelMode}
            exclusive
            onChange={handleModeChange}
            aria-label="travel mode"
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            {(Object.keys(MODE_LABELS) as TravelMode[]).map((mode) => (
              <ToggleButton
                key={mode}
                value={mode}
                aria-label={MODE_LABELS[mode]}
                sx={{ textTransform: 'none', gap: 0.5, px: 2 }}
              >
                {MODE_ICONS[mode]}
                {MODE_LABELS[mode]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Calculate button */}
        <Button
          variant="contained"
          onClick={calculateCommute}
          disabled={loading || !destination}
          sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Calculate'}
        </Button>

        {/* Results */}
        {result && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {MODE_ICONS[result.mode]}
              <Typography variant="h6" fontWeight="bold">
                {result.duration} min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                by {MODE_LABELS[result.mode]}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {result.distance} miles
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box
            sx={{
              p: 2,
              bgcolor: travelMode === 'transit' ? 'info.light' : 'error.light',
              borderRadius: 1,
              border: '1px solid',
              borderColor: travelMode === 'transit' ? 'info.main' : 'error.main',
            }}
          >
            <Typography variant="body2" color="text.primary">
              {error}
            </Typography>
            {travelMode === 'transit' && (
              <Button
                size="small"
                href={`https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${encodeURIComponent(destination)}&travelmode=transit`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 1, textTransform: 'none' }}
              >
                Open Google Maps for Transit
              </Button>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  )
}

export default CommuteCalculator
