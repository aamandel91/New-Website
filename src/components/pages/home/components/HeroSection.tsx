'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'

const PRICE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '$100K', value: '100000' },
  { label: '$200K', value: '200000' },
  { label: '$300K', value: '300000' },
  { label: '$400K', value: '400000' },
  { label: '$500K', value: '500000' },
  { label: '$750K', value: '750000' },
  { label: '$1M', value: '1000000' },
  { label: '$1.5M', value: '1500000' },
  { label: '$2M', value: '2000000' }
]

const HeroSection = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [location, setLocation] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    const query = params.toString()
    router.push(`/search/gallery${query ? `?${query}` : ''}`)
  }

  return (
    <Box
      sx={{
        minHeight: '500px',
        background: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        px: { xs: 2, md: 4 },
        py: { xs: 6, md: 8 }
      }}
    >
      {/* Tab Row */}
      <Tabs
        value={activeTab}
        onChange={(_, newVal: number) => setActiveTab(newVal)}
        sx={{
          mb: 4,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            color: '#fff',
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            minHeight: '40px',
            px: 3,
            py: 1,
            borderRadius: '4px',
            mx: 0.5,
            bgcolor: 'rgba(255,255,255,0.1)',
            '&.Mui-selected': {
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 700
            }
          }
        }}
      >
        <Tab label="Buying" />
        <Tab label="Selling" />
        <Tab label="Home Estimate" />
        <Tab label="Get Pre-Approved" />
      </Tabs>

      {/* Headline */}
      <Typography
        variant="h1"
        sx={{
          color: '#fff',
          fontSize: { xs: '32px', md: '48px' },
          fontWeight: 300,
          textAlign: 'center',
          mb: 1
        }}
      >
        Find Your Dream Home
      </Typography>

      {/* Subheadline */}
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '16px',
          textAlign: 'center',
          mb: 4
        }}
      >
        Enter Your Price Range & Location Below
      </Typography>

      {/* Search Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 },
          maxWidth: '800px',
          width: '100%',
          bgcolor: '#fff',
          borderRadius: '6px',
          overflow: 'hidden',
          p: { xs: 2, md: 0 }
        }}
      >
        <TextField
          placeholder="Location, Zip, Address or MLS #"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          variant="outlined"
          size="small"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
          sx={{
            flex: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: { xs: '4px', md: 0 },
              '& fieldset': { border: 'none', borderRight: { md: '1px solid #ddd' } }
            }
          }}
        />
        <Select
          value={minPrice}
          onChange={(e: SelectChangeEvent) => setMinPrice(e.target.value)}
          displayEmpty
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
              borderRight: { md: '1px solid #ddd' }
            },
            borderRadius: { xs: '4px', md: 0 }
          }}
          renderValue={(val) =>
            val ? PRICE_OPTIONS.find((o) => o.value === val)?.label : 'Min Price'
          }
        >
          {PRICE_OPTIONS.map((opt) => (
            <MenuItem key={`min-${opt.value}`} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <Select
          value={maxPrice}
          onChange={(e: SelectChangeEvent) => setMaxPrice(e.target.value)}
          displayEmpty
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            borderRadius: { xs: '4px', md: 0 }
          }}
          renderValue={(val) =>
            val ? PRICE_OPTIONS.find((o) => o.value === val)?.label : 'Max Price'
          }
        >
          {PRICE_OPTIONS.map((opt) => (
            <MenuItem key={`max-${opt.value}`} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <Button
          onClick={handleSearch}
          sx={{
            bgcolor: '#C4A96E',
            color: '#0F1621',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            borderRadius: { xs: '4px', md: '0 6px 6px 0' },
            px: 4,
            minWidth: '160px',
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: '#b89a5e' }
          }}
        >
          Search Homes
        </Button>
      </Box>
    </Box>
  )
}

export default HeroSection
