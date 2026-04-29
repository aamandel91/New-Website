'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import LocationAutocomplete from '@shared/LocationAutocomplete'
import type { LocationResult } from '@shared/LocationAutocomplete'

const CITIES = [
  'Boca Raton',
  'Boynton Beach',
  'Deerfield Beach',
  'Delray Beach',
  'Fort Lauderdale',
  'Hollywood',
  'Jupiter',
  'Lake Worth',
  'Lighthouse Point',
  'Miami',
  'Miami Beach',
  'Palm Beach',
  'Palm Beach Gardens',
  'Parkland',
  'Pompano Beach',
  'Stuart',
  'West Palm Beach',
  'Weston'
]

const COUNTIES = [
  'Broward',
  'Miami-Dade',
  'Palm Beach',
  'Martin',
  'St. Lucie'
]

const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Villa',
  'Multi-Family',
  'Land',
  'Commercial'
]

const STATUS_OPTIONS = ['Active', 'Sold', 'Pending', 'All'] as const

const BED_BATH_OPTIONS = ['Any', '1+', '2+', '3+', '4+', '5+']

const FEATURES = [
  'Pool',
  'Waterfront',
  'Gated',
  'Golf/Country Club',
  'No HOA',
  'Ocean Access',
  'Pet Friendly',
  'New Construction',
  'Garage'
]

const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdOnDesc' },
  { label: 'Price High-Low', value: 'listPriceDesc' },
  { label: 'Price Low-High', value: 'listPriceAsc' },
  { label: 'Most Bedrooms', value: 'bedsDesc' },
  { label: 'Largest', value: 'sqftDesc' },
  { label: 'Largest Lot', value: 'lotSizeDesc' }
]

const SECTION_SX = {
  mb: 4,
  p: 3,
  bgcolor: '#fff',
  borderRadius: 2,
  border: '1px solid #e0e0e0'
}

const LABEL_SX = {
  fontWeight: 600,
  color: '#0F1621',
  mb: 1.5,
  fontSize: '15px'
}

export default function AdvancedSearchPage() {
  const router = useRouter()

  const [cities, setCities] = useState<string[]>([])
  const [county, setCounty] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [zip, setZip] = useState('')

  const [propertyTypes, setPropertyTypes] = useState<string[]>([])
  const [status, setStatus] = useState<string>('Active')

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBeds, setMinBeds] = useState('Any')
  const [maxBeds, setMaxBeds] = useState('Any')
  const [minBaths, setMinBaths] = useState('Any')
  const [maxBaths, setMaxBaths] = useState('Any')

  const [minSqft, setMinSqft] = useState('')
  const [maxSqft, setMaxSqft] = useState('')
  const [minYearBuilt, setMinYearBuilt] = useState('')
  const [maxYearBuilt, setMaxYearBuilt] = useState('')
  const [minLotSize, setMinLotSize] = useState('')
  const [maxLotSize, setMaxLotSize] = useState('')

  const [features, setFeatures] = useState<string[]>([])
  const [keywords, setKeywords] = useState('')
  const [sortBy, setSortBy] = useState('createdOnDesc')

  const handlePropertyTypeToggle = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleFeatureToggle = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    )
  }

  const parseNumeric = (val: string): string => {
    const num = val.replace(/[^0-9]/g, '')
    return num || ''
  }

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (cities.length) params.set('city', cities.join(','))
    if (county) params.set('area', county)
    if (selectedLocation) {
      const locType = selectedLocation.type?.toLowerCase()
      if (locType === 'neighborhood') {
        params.set('neighborhood', selectedLocation.name)
      } else if (locType === 'city') {
        params.set('city', selectedLocation.name)
      } else if (locType === 'area') {
        params.set('area', selectedLocation.name)
      }
    } else if (neighborhood) {
      params.set('neighborhood', neighborhood)
    }
    if (zip) params.set('location', zip)

    if (propertyTypes.length) params.set('propertyType', propertyTypes.join(','))

    if (status === 'Active') params.set('listingStatus', 'active')
    else if (status === 'Sold') params.set('listingStatus', 'sold')
    else if (status === 'Pending') params.set('listingStatus', 'active')
    else params.set('listingStatus', 'all')

    if (minPrice) params.set('minPrice', parseNumeric(minPrice))
    if (maxPrice) params.set('maxPrice', parseNumeric(maxPrice))

    const bedsVal = (val: string) => (val === 'Any' ? '' : val.replace('+', ''))
    if (bedsVal(minBeds)) params.set('minBeds', bedsVal(minBeds))
    if (bedsVal(maxBeds)) params.set('maxBeds', bedsVal(maxBeds))
    if (bedsVal(minBaths)) params.set('minBaths', bedsVal(minBaths))
    if (bedsVal(maxBaths)) params.set('maxBaths', bedsVal(maxBaths))

    if (minSqft) params.set('minSqft', parseNumeric(minSqft))
    if (maxSqft) params.set('maxSqft', parseNumeric(maxSqft))
    if (minYearBuilt) params.set('minYearBuilt', minYearBuilt)
    if (maxYearBuilt) params.set('maxYearBuilt', maxYearBuilt)
    if (minLotSize) params.set('minLotSize', minLotSize)
    if (maxLotSize) params.set('maxLotSize', maxLotSize)

    if (features.length) params.set('amenities', features.join(','))
    if (keywords) params.set('keywords', keywords)
    if (sortBy !== 'createdOnDesc') params.set('sortBy', sortBy)

    const query = params.toString()
    router.push(`/search/gallery${query ? `?${query}` : ''}`)
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#0F1621',
            mb: 1,
            textAlign: 'center'
          }}
        >
          Advanced Property Search
        </Typography>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 4,
            textAlign: 'center'
          }}
        >
          Use the filters below to find your perfect property
        </Typography>

        {/* Location */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Location</FormLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>City</InputLabel>
              <Select
                multiple
                value={cities}
                onChange={(e: SelectChangeEvent<string[]>) =>
                  setCities(e.target.value as string[])
                }
                input={<OutlinedInput label="City" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((val) => (
                      <Chip key={val} label={val} size="small" />
                    ))}
                  </Box>
                )}
              >
                {CITIES.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>County</InputLabel>
              <Select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                label="County"
              >
                <MenuItem value="">Any</MenuItem>
                {COUNTIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocationAutocomplete
              placeholder="Search neighborhood, city, or area..."
              variant="light"
              navigate={false}
              onSelect={(loc) => {
                setSelectedLocation(loc)
                setNeighborhood(loc.name || '')
              }}
            />
            <TextField
              label="Zip Code"
              size="small"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              fullWidth
            />
          </Box>
        </Box>

        {/* Property Type */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Property Type</FormLabel>
          <FormGroup row sx={{ gap: 1 }}>
            {PROPERTY_TYPES.map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={propertyTypes.includes(type)}
                    onChange={() => handlePropertyTypeToggle(type)}
                    sx={{ '&.Mui-checked': { color: '#C4A96E' } }}
                  />
                }
                label={type}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Status */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Status</FormLabel>
          <RadioGroup
            row
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt}
                value={opt}
                control={
                  <Radio sx={{ '&.Mui-checked': { color: '#C4A96E' } }} />
                }
                label={opt}
              />
            ))}
          </RadioGroup>
        </Box>

        {/* Price Range */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Price Range</FormLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            <TextField
              label="Min Price"
              size="small"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="e.g. 200000"
              fullWidth
            />
            <TextField
              label="Max Price"
              size="small"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 1000000"
              fullWidth
            />
          </Box>
        </Box>

        {/* Bedrooms & Bathrooms */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Bedrooms & Bathrooms</FormLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' },
              gap: 2
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Min Beds</InputLabel>
              <Select
                value={minBeds}
                onChange={(e) => setMinBeds(e.target.value)}
                label="Min Beds"
              >
                {BED_BATH_OPTIONS.map((opt) => (
                  <MenuItem key={`minbed-${opt}`} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Max Beds</InputLabel>
              <Select
                value={maxBeds}
                onChange={(e) => setMaxBeds(e.target.value)}
                label="Max Beds"
              >
                {BED_BATH_OPTIONS.map((opt) => (
                  <MenuItem key={`maxbed-${opt}`} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Min Baths</InputLabel>
              <Select
                value={minBaths}
                onChange={(e) => setMinBaths(e.target.value)}
                label="Min Baths"
              >
                {BED_BATH_OPTIONS.slice(0, 4).map((opt) => (
                  <MenuItem key={`minbath-${opt}`} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Max Baths</InputLabel>
              <Select
                value={maxBaths}
                onChange={(e) => setMaxBaths(e.target.value)}
                label="Max Baths"
              >
                {BED_BATH_OPTIONS.slice(0, 4).map((opt) => (
                  <MenuItem key={`maxbath-${opt}`} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Square Feet */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Square Feet</FormLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            <TextField
              label="Min Sqft"
              size="small"
              value={minSqft}
              onChange={(e) => setMinSqft(e.target.value)}
              placeholder="e.g. 1000"
              fullWidth
            />
            <TextField
              label="Max Sqft"
              size="small"
              value={maxSqft}
              onChange={(e) => setMaxSqft(e.target.value)}
              placeholder="e.g. 5000"
              fullWidth
            />
          </Box>
        </Box>

        {/* Year Built & Lot Size */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Year Built & Lot Size</FormLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' },
              gap: 2
            }}
          >
            <TextField
              label="Min Year Built"
              size="small"
              value={minYearBuilt}
              onChange={(e) => setMinYearBuilt(e.target.value)}
              placeholder="e.g. 2000"
              fullWidth
            />
            <TextField
              label="Max Year Built"
              size="small"
              value={maxYearBuilt}
              onChange={(e) => setMaxYearBuilt(e.target.value)}
              placeholder="e.g. 2024"
              fullWidth
            />
            <TextField
              label="Min Lot Size (acres)"
              size="small"
              value={minLotSize}
              onChange={(e) => setMinLotSize(e.target.value)}
              placeholder="e.g. 0.25"
              fullWidth
            />
            <TextField
              label="Max Lot Size (acres)"
              size="small"
              value={maxLotSize}
              onChange={(e) => setMaxLotSize(e.target.value)}
              placeholder="e.g. 5"
              fullWidth
            />
          </Box>
        </Box>

        {/* Features */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Features</FormLabel>
          <FormGroup row sx={{ gap: 1 }}>
            {FEATURES.map((feature) => (
              <FormControlLabel
                key={feature}
                control={
                  <Checkbox
                    checked={features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    sx={{ '&.Mui-checked': { color: '#C4A96E' } }}
                  />
                }
                label={feature}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Keywords & Sort */}
        <Box sx={SECTION_SX}>
          <FormLabel sx={LABEL_SX}>Keywords & Sorting</FormLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
              gap: 2
            }}
          >
            <TextField
              label="Keywords"
              size="small"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Search in public remarks..."
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Search Button */}
        <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
          <Button
            onClick={handleSearch}
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            sx={{
              bgcolor: '#C4A96E',
              color: '#0F1621',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              px: 6,
              py: 1.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#b89a5e' }
            }}
          >
            Search Properties
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
