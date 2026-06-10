'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { SxProps, Theme } from '@mui/material'
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material'

const CSR_API_URL = 'https://csr-api.repliers.io'
const CSR_API_KEY = process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY || ''

export interface LocationResult {
  name: string
  type: string
  locationId?: string
  address?: {
    city?: string
    area?: string
    neighborhood?: string
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function locationToCleanUrl(result: LocationResult): string {
  const type = result.type?.toLowerCase()
  const name = result.name || ''

  if (type === 'city') {
    return `/${slugify(name)}`
  }
  if (type === 'neighborhood' && result.address?.city) {
    return `/${slugify(result.address.city)}/${slugify(name)}`
  }
  if (type === 'area' && result.address?.city) {
    return `/${slugify(result.address.city)}/${slugify(name)}`
  }
  return `/${slugify(name)}`
}

function getTypeBadge(type: string): { label: string; color: string } {
  switch (type?.toLowerCase()) {
    case 'city':
      return { label: 'City', color: '#1976d2' }
    case 'neighborhood':
      return { label: 'Neighborhood', color: '#9c27b0' }
    case 'area':
      return { label: 'Area', color: '#2e7d32' }
    default:
      return { label: type || '', color: '#757575' }
  }
}

interface LocationAutocompleteProps {
  onSelect?: (location: LocationResult) => void
  placeholder?: string
  variant?: 'dark' | 'light'
  defaultValue?: string
  sx?: SxProps<Theme>
  navigate?: boolean
}

const LocationAutocomplete = ({
  onSelect,
  placeholder = 'Search location...',
  variant = 'dark',
  defaultValue = '',
  sx: sxProp,
  navigate = true
}: LocationAutocompleteProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(defaultValue)
  const [options, setOptions] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDark = variant === 'dark'

  const fetchLocations = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 3) {
      setOptions([])
      setLoading(false)
      return
    }

    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const params = new URLSearchParams({
          search: query,
          type: 'area,city,neighborhood',
          resultsPerPage: '8',
          state: 'FL'
        })
        const res = await fetch(
          `${CSR_API_URL}/locations/autocomplete?${params}`,
          {
            headers: {
              'REPLIERS-API-KEY': CSR_API_KEY,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          }
        )
        if (res.ok) {
          const data = await res.json()
          const results: LocationResult[] = Array.isArray(data)
            ? data
            : data?.results || data?.suggestions || []
          if (!controller.signal.aborted) {
            setOptions(results)
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('LocationAutocomplete fetch error:', err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSelect = (_: any, value: LocationResult | string | null) => {
    if (!value || typeof value === 'string') return
    setOpen(false)
    setInputValue(value.name || '')

    if (onSelect) {
      onSelect(value)
    }

    if (navigate) {
      const cleanUrl = locationToCleanUrl(value)
      router.push(cleanUrl)
    }
  }

  const darkStyles = {
    '& .MuiOutlinedInput-root': {
      color: '#fff !important',
      '& fieldset': {
        borderColor: 'rgba(255,255,255,0.3)'
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255,255,255,0.5)'
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgba(255,255,255,0.7)'
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(255,255,255,0.05)'
      }
    },
    '& .MuiInputBase-input': {
      color: '#fff !important',
      caretColor: '#fff',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.6) !important',
        opacity: '1 !important'
      }
    },
    '& .MuiInputBase-input:focus': {
      color: '#fff !important'
    },
    '& .MuiAutocomplete-clearIndicator': {
      color: 'rgba(255,255,255,0.7)'
    },
    '& .MuiAutocomplete-popupIndicator': {
      color: 'rgba(255,255,255,0.7)'
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255,255,255,0.6)'
    },
    '& .MuiFilledInput-root': {
      color: '#fff !important',
      '&:hover': { color: '#fff !important' },
      '&.Mui-focused': { color: '#fff !important' }
    },
    '& .MuiFilledInput-input': {
      color: '#fff !important',
      caretColor: '#fff',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.6) !important',
        opacity: '1 !important'
      }
    }
  }

  const lightStyles = {
    '& .MuiOutlinedInput-root': {
      color: '#0F1621',
      '& fieldset': {
        borderColor: '#ccc'
      },
      '&:hover fieldset': {
        borderColor: '#999'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2'
      }
    },
    '& .MuiInputBase-input': {
      color: '#0F1621',
      '&::placeholder': {
        color: 'rgba(0,0,0,0.4)',
        opacity: 1
      }
    },
    '& .MuiAutocomplete-clearIndicator': {
      color: 'rgba(0,0,0,0.5)'
    },
    '& .MuiAutocomplete-popupIndicator': {
      color: 'rgba(0,0,0,0.5)'
    }
  }

  const variantStyles = isDark ? darkStyles : lightStyles

  return (
    <Autocomplete
      open={open}
      freeSolo
      fullWidth
      blurOnSelect
      clearOnEscape
      options={options}
      loading={loading}
      filterOptions={(x) => x}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.name || ''
      }
      onBlur={() => setOpen(false)}
      onFocus={() => {
        if (inputValue.length >= 3 && options.length > 0) setOpen(true)
      }}
      onChange={handleSelect}
      inputValue={inputValue}
      onInputChange={(_, newValue, reason) => {
        if (reason === 'input') {
          setInputValue(newValue)
          fetchLocations(newValue)
          setOpen(newValue.length >= 3)
        } else if (reason === 'clear') {
          setInputValue('')
          setOptions([])
          setOpen(false)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          autoComplete="off"
          sx={variantStyles}
          slotProps={{
            htmlInput: {
              ...params.inputProps,
              autoComplete: 'off',
              style: { color: isDark ? '#fff' : '#0F1621' }
            }
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } =
          props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }
        const badge = getTypeBadge(option.type)
        return (
          <Box
            component="li"
            key={key}
            {...otherProps}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 2
            }}
          >
            <Chip
              label={badge.label}
              size="small"
              sx={{
                bgcolor: badge.color,
                color: '#fff',
                fontSize: '0.65rem',
                height: 20,
                minWidth: 60,
                '& .MuiChip-label': { px: 1 }
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap>
                {option.name}
              </Typography>
              {option.address?.city && option.type !== 'city' && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.address.city}
                </Typography>
              )}
            </Box>
          </Box>
        )
      }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#fff',
            color: '#0F1621',
            '& .MuiAutocomplete-option': {
              color: '#0F1621'
            }
          }
        }
      }}
      sx={sxProp}
    />
  )
}

export default LocationAutocomplete
