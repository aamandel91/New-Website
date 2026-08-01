'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { SelectChangeEvent } from '@mui/material'
import { Box, Button, MenuItem, Select, Typography } from '@mui/material'

import { tenant } from '@/configs/tenant.config'
import type { LocationResult } from '@shared/LocationAutocomplete'
// Lazy variant: keeps MUI Autocomplete + Popper out of the homepage's initial
// chunk; shows a lookalike TextField until the real component hydrates.
import LocationAutocomplete from '@shared/LocationAutocompleteLazy'

type HeroTab = 'buying' | 'selling' | 'estimate'

const TABS = [
  { key: 'buying' as const, label: 'Buying' },
  { key: 'selling' as const, label: 'Selling' },
  { key: 'estimate' as const, label: 'Home Estimate' },
  {
    key: 'preapproved' as const,
    label: 'Get Pre-Approved',
    href: tenant.integrations.lender.applyUrl
  },
  {
    key: 'instantoffer' as const,
    label: 'Instant Offer',
    href: tenant.integrations.instantOffer.url
  }
] as const

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

const TAB_CONTENT: Record<HeroTab, { headline: string; subheadline: string }> =
  {
    buying: {
      headline: 'Find Your Dream Home',
      subheadline: 'Enter Your Price Range & Location Below'
    },
    selling: {
      headline: 'Get the Strongest Cash Offer on Your Home',
      subheadline: 'Your terms and schedule, without the hassle.'
    },
    estimate: {
      headline: 'Find Out What Your Home is Really Worth',
      subheadline:
        'Get a free, instant AI-powered estimate of your home\u2019s value.'
    }
  }

const HeroSection = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<HeroTab>('buying')
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.heroImageUrl) setHeroImageUrl(data.heroImageUrl)
      })
      .catch(() => {
        // keep gradient fallback
      })
  }, [])

  const handleTabClick = (tab: (typeof TABS)[number]) => {
    if ('href' in tab && tab.href) {
      window.open(tab.href, '_blank', 'noopener,noreferrer')
      return
    }
    const key = tab.key as HeroTab
    if (key === 'buying' || key === 'selling' || key === 'estimate') {
      setActiveTab(key)
    }
  }

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location)
  }

  const handleAddressSelect = (location: LocationResult) => {
    setAddressInput(location.name ?? '')
  }

  const handleBuyingSearch = () => {
    const params = new URLSearchParams()
    if (selectedLocation?.name) {
      params.set('city', selectedLocation.name)
    }
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    const query = params.toString()
    router.push(`/search/gallery${query ? `?${query}` : ''}`)
  }

  const handleSellingSubmit = () => {
    router.push('/sell')
  }

  const handleEstimateSubmit = () => {
    router.push('/home-value')
  }

  const { headline, subheadline } = TAB_CONTENT[activeTab]

  const heroBackground = heroImageUrl
    ? 'none'
    : tenant.visualIdentity.heroImages.homepageGradient

  return (
    <Box
      sx={{
        minHeight: '500px',
        background: heroBackground,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        px: { xs: 2, md: 4 },
        py: { xs: 6, md: 8 },
        overflow: 'hidden'
      }}
    >
      {/* Background image with dark overlay */}
      {heroImageUrl && (
        <>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(15, 22, 33, 0.65)',
              zIndex: 1
            }}
          />
        </>
      )}

      {/* Tab Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 4,
          flexWrap: 'wrap',
          justifyContent: 'center',
          overflowX: { xs: 'auto', md: 'visible' },
          maxWidth: '100%',
          px: 1,
          zIndex: 2
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab && !('href' in tab && tab.href)

          return (
            <Box
              key={tab.key}
              component="button"
              onClick={() => handleTabClick(tab)}
              sx={{
                bgcolor: isActive ? '#C4A96E' : 'rgba(255,255,255,0.1)',
                color: isActive ? '#0F1621' : '#fff',
                fontWeight: isActive ? 700 : 400,
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: '4px',
                px: 3,
                py: 1,
                minHeight: '40px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isActive ? '#C4A96E' : 'rgba(255,255,255,0.2)'
                }
              }}
            >
              {tab.label}
            </Box>
          )
        })}
      </Box>

      {/* Headline */}
      <Typography
        variant="h1"
        sx={{
          color: '#fff',
          fontSize: { xs: '32px', md: '48px' },
          fontWeight: 300,
          textAlign: 'center',
          mb: 1,
          zIndex: 2
        }}
      >
        {headline}
      </Typography>

      {/* Subheadline */}
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '16px',
          textAlign: 'center',
          mb: 4,
          zIndex: 2
        }}
      >
        {subheadline}
      </Typography>

      {/* Buying Tab — Search Bar */}
      {activeTab === 'buying' && (
        <Box
          sx={{
            maxWidth: '800px',
            width: '100%',
            bgcolor: '#fff',
            borderRadius: '6px',
            overflow: 'hidden',
            p: { xs: 2, md: 0 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1.5, md: 0 },
            zIndex: 2
          }}
        >
          {/* Location — full width on mobile */}
          <Box sx={{ width: '100%', display: { md: 'none' } }}>
            <LocationAutocomplete
              placeholder="Location, Zip, Address or MLS #"
              variant="light"
              navigate={false}
              onSelect={handleLocationSelect}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& fieldset': { border: '1px solid #ddd' }
                }
              }}
            />
          </Box>

          {/* Price selects — side by side on mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <Select
              value={minPrice}
              onChange={(e: SelectChangeEvent) => setMinPrice(e.target.value)}
              displayEmpty
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                borderRadius: '4px'
              }}
              renderValue={(val) =>
                val
                  ? PRICE_OPTIONS.find((o) => o.value === val)?.label
                  : 'Min Price'
              }
            >
              {PRICE_OPTIONS.map((opt) => (
                <MenuItem key={`min-m-${opt.value}`} value={opt.value}>
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
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                borderRadius: '4px'
              }}
              renderValue={(val) =>
                val
                  ? PRICE_OPTIONS.find((o) => o.value === val)?.label
                  : 'Max Price'
              }
            >
              {PRICE_OPTIONS.map((opt) => (
                <MenuItem key={`max-m-${opt.value}`} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Button — full width on mobile */}
          <Button
            onClick={handleBuyingSearch}
            sx={{
              display: { xs: 'flex', md: 'none' },
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              px: 4,
              py: 1.5,
              width: '100%',
              '&:hover': { bgcolor: '#b89a5e' }
            }}
          >
            Search Homes
          </Button>

          {/* Desktop: single-row layout (unchanged) */}
          <Box
            sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'row' }}
          >
            <Box sx={{ flex: 2, minWidth: 0 }}>
              <LocationAutocomplete
                placeholder="Location, Zip, Address or MLS #"
                variant="light"
                navigate={false}
                onSelect={handleLocationSelect}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    '& fieldset': {
                      border: 'none',
                      borderRight: '1px solid #ddd'
                    }
                  }
                }}
              />
            </Box>
            <Select
              value={minPrice}
              onChange={(e: SelectChangeEvent) => setMinPrice(e.target.value)}
              displayEmpty
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                  borderRight: '1px solid #ddd'
                },
                borderRadius: 0
              }}
              renderValue={(val) =>
                val
                  ? PRICE_OPTIONS.find((o) => o.value === val)?.label
                  : 'Min Price'
              }
            >
              {PRICE_OPTIONS.map((opt) => (
                <MenuItem key={`min-d-${opt.value}`} value={opt.value}>
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
                borderRadius: 0
              }}
              renderValue={(val) =>
                val
                  ? PRICE_OPTIONS.find((o) => o.value === val)?.label
                  : 'Max Price'
              }
            >
              {PRICE_OPTIONS.map((opt) => (
                <MenuItem key={`max-d-${opt.value}`} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            <Button
              onClick={handleBuyingSearch}
              sx={{
                bgcolor: '#C4A96E',
                color: '#0F1621',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                borderRadius: '0 6px 6px 0',
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
      )}

      {/* Selling Tab — Address Input */}
      {activeTab === 'selling' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
            maxWidth: '600px',
            width: '100%',
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
            p: { xs: 2, md: 0 },
            zIndex: 2
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <LocationAutocomplete
              placeholder="Enter your address"
              variant="dark"
              navigate={false}
              onSelect={handleAddressSelect}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: '4px', md: '6px 0 0 6px' },
                  '& fieldset': { border: 'none' }
                }
              }}
            />
          </Box>
          <Button
            onClick={handleSellingSubmit}
            sx={{
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: { xs: '4px', md: '0 6px 6px 0' },
              px: 4,
              minWidth: '140px',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#b89a5e' }
            }}
          >
            Get Started
          </Button>
        </Box>
      )}

      {/* Estimate Tab — Address Input */}
      {activeTab === 'estimate' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
            maxWidth: '600px',
            width: '100%',
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
            p: { xs: 2, md: 0 },
            zIndex: 2
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <LocationAutocomplete
              placeholder="Enter your address"
              variant="dark"
              navigate={false}
              onSelect={handleAddressSelect}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: '4px', md: '6px 0 0 6px' },
                  '& fieldset': { border: 'none' }
                }
              }}
            />
          </Box>
          <Button
            onClick={handleEstimateSubmit}
            sx={{
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: { xs: '4px', md: '0 6px 6px 0' },
              px: 4,
              minWidth: '140px',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#b89a5e' }
            }}
          >
            Find Out
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default HeroSection
