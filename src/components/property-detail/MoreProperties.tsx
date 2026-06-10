'use client'

import React from 'react'
import Link from 'next/link'

import {
  Box,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography
} from '@mui/material'

import { type Property } from 'services/API'
import { generatePropertyUrl } from 'utils/propertyUrls'

interface MorePropertiesProps {
  properties: Property[]
  currentPropertyMls?: string
  city?: string
  state?: string
  neighborhood?: string
  priceRange?: string
}

const MoreProperties: React.FC<MorePropertiesProps> = ({
  properties,
  currentPropertyMls,
  city,
  state,
  neighborhood,
  priceRange
}) => {
  // Filter out current property
  const filteredProperties = currentPropertyMls
    ? properties.filter((p) => p.mlsNumber !== currentPropertyMls)
    : properties

  if (filteredProperties.length === 0) {
    return null
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

  const truncateDescription = (
    text: string | undefined,
    maxLength: number = 150
  ) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // Build keyword-rich heading
  const buildHeading = () => {
    const parts = ['More Properties']

    if (neighborhood) {
      parts.push(`in ${neighborhood}`)
    } else if (city && state) {
      parts.push(`in ${city}, ${state}`)
    }

    if (priceRange) {
      parts.push(`around ${priceRange}`)
    }

    return parts.join(' ')
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* SEO-optimized H3 heading with keywords */}
      <Typography variant="h6" component="h3" gutterBottom>
        {buildHeading()}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Explore additional homes that match your search criteria. Each listing
        includes a preview to help you find your perfect property faster.
      </Typography>

      <Stack spacing={2} divider={<Divider />}>
        {filteredProperties.slice(0, 10).map((property: any) => {
          const propertyUrl = generatePropertyUrl(
            property.address || {},
            property.mlsNumber
          )
          const address = property.address
            ? `${[property.address.streetNumber, property.address.streetName, property.address.streetSuffix].filter(Boolean).join(' ')}, ${property.address.city}, ${property.address.state} ${property.address.zip}`
            : 'Address not available'

          return (
            <Box key={property.mlsNumber}>
              <Link href={propertyUrl} passHref legacyBehavior>
                <MuiLink
                  underline="hover"
                  sx={{
                    display: 'block',
                    '&:hover h6': {
                      color: 'primary.main'
                    }
                  }}
                >
                  {/* Property Title with Price and Address */}
                  <Typography
                    variant="subtitle1"
                    component="h4"
                    fontWeight="bold"
                    color="text.primary"
                    sx={{ mb: 0.5 }}
                  >
                    {formatPrice(property.price)} - {property.beds} Bed,{' '}
                    {property.baths} Bath {property.propertyType || 'Home'} in{' '}
                    {property.address?.city || 'City'}
                  </Typography>

                  {/* Address */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {address}
                  </Typography>

                  {/* Property Description Preview (First 150 characters) */}
                  {property.description && (
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6
                      }}
                    >
                      {truncateDescription(property.description, 150)}
                    </Typography>
                  )}

                  {/* Key Features */}
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    {property.sqft && (
                      <Typography variant="caption" color="text.secondary">
                        {property.sqft.toLocaleString()} sq ft
                      </Typography>
                    )}
                    {property.yearBuilt && (
                      <Typography variant="caption" color="text.secondary">
                        Built {property.yearBuilt}
                      </Typography>
                    )}
                    {property.lotSize && (
                      <Typography variant="caption" color="text.secondary">
                        {property.lotSize} acres
                      </Typography>
                    )}
                    <Typography variant="caption" color="primary.main">
                      MLS# {property.mlsNumber}
                    </Typography>
                  </Stack>
                </MuiLink>
              </Link>
            </Box>
          )
        })}
      </Stack>

      {/* Footer with additional search link */}
      {filteredProperties.length > 10 && (
        <Box
          sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Link
            href={`/search${city ? `?city=${encodeURIComponent(city)}` : ''}`}
            passHref
            legacyBehavior
          >
            <MuiLink variant="body2" fontWeight="medium">
              {neighborhood || city || 'Florida'} Homes for Sale (
              {filteredProperties.length} listings) →
            </MuiLink>
          </Link>
        </Box>
      )}
    </Paper>
  )
}

export default MoreProperties
