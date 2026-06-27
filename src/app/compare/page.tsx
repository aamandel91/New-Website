'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import searchConfig from '@configs/search'
import { usePropertyComparison } from '@/hooks/usePropertyComparison'

import { type Property } from 'services/API'
import { APIPropertyDetails } from 'services/API'
import { generatePropertyUrl } from 'utils/propertyUrls'

const ComparisonPageContent: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { properties: storedProperties, removeProperty } =
    usePropertyComparison()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        const mlsNumbers = searchParams.get('properties')?.split(',') || []

        if (mlsNumbers.length === 0 && storedProperties.length === 0) {
          setError('No properties selected for comparison')
          setLoading(false)
          return
        }

        // Use stored properties if no query params
        if (mlsNumbers.length === 0) {
          setProperties(storedProperties)
          setLoading(false)
          return
        }

        // Fetch properties by MLS numbers
        const fetchedProperties = await Promise.all(
          mlsNumbers.map(async (mls) => {
            try {
              return await APIPropertyDetails.fetchProperty(
                mls,
                searchConfig.defaultBoardId
              )
            } catch (err) {
              console.error(`Failed to fetch property ${mls}:`, err)
              return null
            }
          })
        )

        const validProperties = fetchedProperties.filter(
          (p): p is Property => p !== null
        )
        setProperties(validProperties)
        setLoading(false)
      } catch (err) {
        setError('Failed to load properties for comparison')
        setLoading(false)
      }
    }

    fetchProperties()
  }, [searchParams, storedProperties])

  const handleRemove = (mlsNumber: string) => {
    setProperties((prev) => prev.filter((p) => p.mlsNumber !== mlsNumber))
    removeProperty(mlsNumber)
  }

  const handleViewProperty = (property: Property) => {
    const url = generatePropertyUrl(property.address || {}, property.mlsNumber)
    router.push(url)
  }

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatNumber = (num: number | undefined) => {
    if (!num) return 'N/A'
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading comparison...</Typography>
      </Container>
    )
  }

  if (error || properties.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error ||
            'No properties to compare. Please add properties to comparison first.'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/search')}
        >
          Back to Search
        </Button>
      </Container>
    )
  }

  const getPrice = (p: Property) => Number(p.listPrice) || 0
  const getBeds = (p: Property) => p.details?.numBedrooms || ''
  const getBaths = (p: Property) => p.details?.numBathrooms || ''
  const getSqft = (p: Property) => Number(p.details?.sqft) || 0

  const comparisonData = [
    { label: 'Price', getValue: (p: Property) => formatPrice(getPrice(p)) },
    { label: 'Status', getValue: (p: Property) => p.status || 'N/A' },
    {
      label: 'Beds',
      getValue: (p: Property) => getBeds(p)?.toString() || 'N/A'
    },
    {
      label: 'Baths',
      getValue: (p: Property) => getBaths(p)?.toString() || 'N/A'
    },
    {
      label: 'Square Feet',
      getValue: (p: Property) => formatNumber(getSqft(p))
    },
    {
      label: 'Price per Sq Ft',
      getValue: (p: Property) => {
        const price = getPrice(p)
        const sqft = getSqft(p)
        return price && sqft ? formatPrice(price / sqft) : 'N/A'
      }
    },
    {
      label: 'Year Built',
      getValue: (p: Property) => p.details?.yearBuilt?.toString() || 'N/A'
    },
    {
      label: 'Lot Size',
      getValue: (p: Property) => (p.lot?.acres ? `${p.lot.acres} acres` : 'N/A')
    },
    {
      label: 'Property Type',
      getValue: (p: Property) => p.details?.propertyType || 'N/A'
    },
    {
      label: 'HOA',
      getValue: (p: Property) =>
        p.condominium?.fees?.maintenance
          ? formatPrice(Number(p.condominium.fees.maintenance))
          : 'N/A'
    },
    {
      label: 'Annual Taxes',
      getValue: (p: Property) =>
        p.taxes?.annualAmount ? formatPrice(p.taxes.annualAmount) : 'N/A'
    },
    {
      label: 'Days on Market',
      getValue: (p: Property) => p.daysOnMarket?.toString() || 'N/A'
    }
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight="bold">
          Compare Properties
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 180 }}>
                Feature
              </TableCell>
              {properties.map((property) => (
                <TableCell key={property.mlsNumber} sx={{ minWidth: 250 }}>
                  <Stack spacing={2}>
                    {/* Property Image */}
                    <Box
                      sx={{
                        position: 'relative',
                        height: 200,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {property.images?.[0] ? (
                        <Image
                          src={
                            typeof property.images[0] === 'string'
                              ? property.images[0]
                              : property.images[0] &&
                                  typeof property.images[0] === 'object' &&
                                  'url' in property.images[0] &&
                                  typeof property.images[0].url === 'string'
                                ? property.images[0].url
                                : ''
                          }
                          alt={`Property ${property.mlsNumber}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            No Image
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(property.mlsNumber)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,1)'
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Address */}
                    <Box>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {property.address
                          ? `${property.address.streetNumber || ''} ${property.address.streetName || ''}`.trim() ||
                            'Address N/A'
                          : 'Address N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {property.address?.city}, {property.address?.state}{' '}
                        {property.address?.zip}
                      </Typography>
                    </Box>

                    {/* MLS Number */}
                    <Chip label={`MLS# ${property.mlsNumber}`} size="small" />

                    {/* View Button */}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleViewProperty(property)}
                      fullWidth
                    >
                      View Details
                    </Button>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {comparisonData.map((row, index) => (
              <TableRow
                key={row.label}
                sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}
              >
                <TableCell sx={{ fontWeight: 'bold' }}>{row.label}</TableCell>
                {properties.map((property) => (
                  <TableCell key={property.mlsNumber}>
                    {row.getValue(property)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {properties.length < 4 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          You can compare up to 4 properties. Add more properties from search
          results to compare.
        </Alert>
      )}
    </Container>
  )
}

const ComparisonPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Container
          maxWidth="xl"
          sx={{ py: 4, display: 'flex', justifyContent: 'center' }}
        >
          <CircularProgress />
        </Container>
      }
    >
      <ComparisonPageContent />
    </Suspense>
  )
}

export default ComparisonPage
