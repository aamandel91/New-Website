'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  Autocomplete,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  TextField
} from '@mui/material'
import { type AutocompleteRenderInputParams } from '@mui/material/Autocomplete'

import mapConfig from '@configs/map'
import searchConfig from '@configs/search'
import IcoSearch from '@icons/IcoSearch'

import { APISearch } from 'services/API'
import {
  type AutosuggestionOption,
  type MapboxAddress,
  type Property
} from 'services/API'
import MapService, { MapSearch } from 'services/Map'
import SearchService from 'services/Search'
import { useLocations } from 'providers/LocationsProvider'
import { type MapPosition } from 'providers/MapOptionsProvider'
import useClientSide from 'hooks/useClientSide'
import useDebouncedEffect from 'hooks/useDebouncedEffect'
import {
  calcBoundsAtZoom,
  calcZoomLevel,
  getCenter,
  getCoords,
  getMapUrl,
  getZoom,
  toMapboxBounds,
  toMapboxPoint
} from 'utils/map'
import { getSeoUrl } from 'utils/properties'

import OptionAddress from './components/OptionAddress'
import OptionArea from './components/OptionArea'
import OptionGroup from './components/OptionGroup'
import OptionListing from './components/OptionListing'
import OptionLoader from './components/OptionLoader'
import {
  getAddressLabel,
  getAreaLabel,
  getListingLabel,
  removeQueryParam,
  updateQueryParam
} from './utils'

const { minCharsToSuggest } = searchConfig
const { defaultAddressZoom, defaultAreaZoom } = mapConfig

const CSR_API_URL = 'https://csr-api.repliers.io'
const CSR_API_KEY = process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY || ''

interface LocationResult {
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

const Autosuggestion = ({
  showButton = false,
  buttonTitle = ''
}: {
  showButton?: boolean
  buttonTitle?: string | React.ReactNode
}) => {
  const router = useRouter()
  const t = useTranslations()
  const clientSide = useClientSide()

  const searchParams = useSearchParams()
  const paramsQuery = searchParams.get('q') || ''
  const paramsPosition = useMemo(
    () => ({
      zoom: getZoom(searchParams),
      center: getCoords(searchParams)
    }),
    []
  )
  const [position, setPosition] =
    useState<Omit<MapPosition, 'bounds'>>(paramsPosition)

  const { searchLocations } = useLocations()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [areaLoading, setAreaLoading] = useState(false)
  const [searchString, setSearchString] = useState(paramsQuery)

  const [listings, setListings] = useState<Property[]>([])
  const [address, setAddress] = useState<MapboxAddress[]>([])
  const [locations, setLocations] = useState<AutosuggestionOption[]>([])

  const abortRef = useRef<AbortController | null>(null)

  const { map } = MapService

  const handleButtonClick = () => {
    if (map && position.center) {
      map.flyTo({
        center: position.center,
        zoom: position.zoom,
        curve: 1
      })
    }
  }

  useDebouncedEffect(
    () => {
      const query = searchString.toLowerCase().trim()

      const fetchData = async () => {
        // Cancel previous request
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        try {
          // Fetch from Repliers Locations Autocomplete API (CSR)
          const locationResults: AutosuggestionOption[] = []

          if (CSR_API_KEY) {
            try {
              const locParams = new URLSearchParams({
                search: query,
                type: 'area,city,neighborhood',
                resultsPerPage: '8',
                state: 'FL',
              })
              const locRes = await fetch(
                `${CSR_API_URL}/locations/autocomplete?${locParams}`,
                {
                  headers: {
                    'REPLIERS-API-KEY': CSR_API_KEY,
                    'Content-Type': 'application/json',
                  },
                  signal: controller.signal,
                }
              )
              if (locRes.ok) {
                const locData = await locRes.json()
                const results: LocationResult[] = Array.isArray(locData)
                  ? locData
                  : locData?.results || locData?.suggestions || []
                for (const result of results) {
                  const type = result.type?.toLowerCase()
                  locationResults.push({
                    type: type === 'neighborhood' ? 'neighborhood' : 'city',
                    source: { name: result.name || '' },
                    parent: result.address?.city ? { name: result.address.city } : undefined,
                    _locationResult: result,
                  } as AutosuggestionOption & { _locationResult: LocationResult })
                }
              }
            } catch (err: any) {
              if (err?.name !== 'AbortError') {
                // Fallback to trie search
                const trieQuery = query.split(',').at(0) || ''
                const trieResults = await searchLocations(trieQuery)
                locationResults.push(...trieResults)
              }
            }
          } else {
            // No CSR key, use trie search
            const trieQuery = query.split(',').at(0) || ''
            const trieResults = await searchLocations(trieQuery)
            locationResults.push(...trieResults)
          }

          if (controller.signal.aborted) return
          setLocations(locationResults)

          // Also fetch address + listing suggestions
          const { address, listings } =
            await APISearch.fetchAutosuggestions(query)
          if (controller.signal.aborted) return
          setAddress(address)
          setListings(listings)
        } catch (error: any) {
          if (error?.name === 'AbortError') return
          if (error?.status !== 401) {
            console.error('Failed to fetch autosuggestions:', error)
          }
        } finally {
          setLoading(false)
        }
      }

      if (query.length >= minCharsToSuggest) {
        fetchData()
      }
    },
    250,
    [searchString]
  )

  // Options for <Autocomplete />
  const options = []

  if (loading) {
    options.push({ type: 'loader' })
  } else {
    locations.forEach((location) => {
      const { source, parent } = location
      options.push({
        type: 'city',
        source,
        parent
      })
    })
    address.forEach((address) => {
      options.push({
        type: 'address',
        source: address
      })
    })
    listings.forEach((listing) => {
      options.push({
        type: 'listing',
        source: listing
      })
    })
  }

  const renderOptionElement = (
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: any
  ) => {
    const { key, ...otherProps } = props
    switch (option.type) {
      case 'loader':
        return <OptionLoader key="loader" />
      case 'city':
      case 'neighborhood':
        return <OptionArea key={key} props={otherProps} option={option} />
      case 'address':
        return <OptionAddress key={key} props={otherProps} option={option} />
      case 'listing':
        return <OptionListing key={key} props={otherProps} option={option} />
      default:
        return null
    }
  }

  const renderInputElement = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      variant="filled"
      placeholder={t('Search.autosuggestPlaceholder')}
      autoComplete="off"
      sx={{
        '& .MuiFilledInput-root': {
          color: '#fff !important',
          '&:hover': { color: '#fff !important' },
          '&.Mui-focused': {
            color: '#fff !important',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }
        },
        '& .MuiFilledInput-input': {
          color: '#fff !important',
          caretColor: '#fff',
          '&::placeholder': {
            color: 'rgba(255,255,255,0.6) !important',
            opacity: '1 !important'
          }
        },
        '& .MuiInputBase-input': {
          color: '#fff !important'
        },
        '& .MuiInputBase-input:focus': {
          color: '#fff !important'
        },
        '& .MuiOutlinedInput-input': {
          color: '#fff !important'
        },
        '& .MuiOutlinedInput-root': {
          color: '#fff !important',
          '&.Mui-focused .MuiInputBase-input': {
            color: '#fff !important'
          }
        }
      }}
      slotProps={{
        input: {
          ...params.InputProps,
          endAdornment: areaLoading ? (
            <CircularProgress
              size={18}
              sx={{
                position: 'absolute',
                right: 18,
                color: 'rgba(255,255,255,0.7)'
              }}
            />
          ) : (
            params.InputProps.endAdornment
          )
        },

        htmlInput: {
          ...params.inputProps,
          autoComplete: 'off',
          style: { color: '#fff' }
        }
      }}
    />
  )

  const getOptionLabel = (option: any) => {
    switch (option.type) {
      case 'city':
      case 'neighborhood':
        return getAreaLabel(option)
      case 'address':
        return getAddressLabel(option)
      case 'listing':
        return getListingLabel(option)
      default:
        return ''
    }
  }

  const clearOptions = () => {
    setOpen(false)
    setAddress([])
    setListings([])
    setLocations([])
    setSearchString('')
    setPosition({ center: null, zoom: defaultAddressZoom })
    if (map) {
      const strippedUrl = removeQueryParam()
      router.replace(strippedUrl)
    }
  }

  const handleAddressClick = async (option: any) => {
    setOpen(false)
    setAreaLoading(true)
    const addr = option.source as MapboxAddress
    const point = await MapSearch.fetchMapboxAddressPoint(addr)
    if (!point) {
      setAreaLoading(false)
      return
    }

    const zoom = defaultAddressZoom
    const center = toMapboxPoint(point)
    const query = getAddressLabel(option)

    if (map) {
      const apiBounds = calcBoundsAtZoom(map, point, zoom)
      const mapboxBounds = toMapboxBounds(apiBounds)

      setSearchString(query)
      setPosition({ zoom, center })
      map.fitBounds(mapboxBounds.toArray())
      const updatedUrl = updateQueryParam(query)
      router.replace(updatedUrl)
    } else {
      const coordsUrl = getMapUrl({ zoom, center, query })
      router.push(coordsUrl)
    }

    setTimeout(() => {
      setAreaLoading(false)
    }, 500)
  }

  const handleAreaClick = async (option: any) => {
    setOpen(false)
    setAreaLoading(true)

    // If this came from Locations Autocomplete, navigate to clean URL
    const locResult = (option as any)?._locationResult as LocationResult | undefined
    if (locResult) {
      const cleanUrl = locationToCleanUrl(locResult)
      router.push(cleanUrl)
      setAreaLoading(false)
      return
    }

    const query = getAreaLabel(option)
    const bounds = await SearchService.fetchBoundsForArea(query)
    if (!bounds) {
      setAreaLoading(false)
      return
    }

    const center = getCenter(bounds)

    if (map) {
      const zoom = calcZoomLevel(map, bounds)
      const mapboxBounds = toMapboxBounds(bounds)

      setSearchString(query)
      setPosition({ zoom, center })
      map.fitBounds(mapboxBounds.toArray())
      const updatedUrl = updateQueryParam(query)
      router.replace(updatedUrl)
    } else {
      const zoom = defaultAreaZoom
      const coordsUrl = getMapUrl({ zoom, center, query })
      router.push(coordsUrl)
    }

    setTimeout(() => {
      setAreaLoading(false)
    }, 500)
  }

  const handleListingClick = (option: any) => {
    router.push(getSeoUrl(option.source as Property))
  }

  const handleChange = (option: any) => {
    if (!option) return

    switch (option.type) {
      case 'city':
      case 'neighborhood':
        handleAreaClick(option)
        break
      case 'address':
        handleAddressClick(option)
        break
      case 'listing':
        handleListingClick(option)
        break
      default:
    }
  }

  if (!clientSide) {
    return <Skeleton variant="rounded" sx={{ height: 48 }} />
  }

  return (
    <Stack spacing={0} direction="row" alignItems="center" width="100%">
      <Autocomplete
        open={open}
        freeSolo
        fullWidth
        blurOnSelect
        autoHighlight
        selectOnFocus
        clearOnEscape
        disableListWrap
        handleHomeEndKeys
        options={options}
        filterSelectedOptions
        filterOptions={(x) => x}
        groupBy={(option) => option.type}
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(searchString.length >= minCharsToSuggest)}
        onChange={(e, v) => handleChange(v)}
        inputValue={searchString}
        onInputChange={(_, newValue, reason) => {
          if (reason === 'input') {
            setSearchString(newValue)
            setOpen(newValue.length >= minCharsToSuggest)
          } else if (reason === 'clear') {
            clearOptions()
          }
        }}
        getOptionLabel={getOptionLabel}
        renderInput={renderInputElement}
        renderOption={renderOptionElement}
        renderGroup={({ key, group, children }) => (
          <OptionGroup key={key} group={group}>
            {children}
          </OptionGroup>
        )}
      />
      {showButton && (
        <Button
          variant="contained"
          onClick={handleButtonClick}
          sx={{ minWidth: 56 }}
        >
          {buttonTitle || <IcoSearch color="white" size={18} />}
        </Button>
      )}
    </Stack>
  )
}

export default Autosuggestion
