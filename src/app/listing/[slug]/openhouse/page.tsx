import React from 'react'
import type { Metadata } from 'next'
import { Container, Box, Typography, Paper, Stack, Divider, Alert } from '@mui/material'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { APIPropertyDetails } from 'services/API'
import searchConfig from '@configs/search'
import OpenHouseForm from 'components/open-house/OpenHouseForm'
import { parsePropertySlug } from 'utils/propertyUrls'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Force noindex, nofollow for all open house pages
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const { mlsNumber } = parsePropertySlug(params.slug)

  try {
    const property: any = await APIPropertyDetails.fetchProperty(mlsNumber, searchConfig.defaultBoardId)

    const addr = property.address || {}
    const street = addr.street || `${addr.streetNumber || ''} ${addr.streetName || ''} ${addr.streetSuffix || ''}`.trim()
    const address = street
      ? `${street}, ${addr.city || ''}, ${addr.state || ''}`
      : 'Property'

    return {
      title: `Open House Sign-In - ${address}`,
      description: `Sign in to our open house at ${address}`,
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    }
  } catch {
    return {
      title: 'Open House Sign-In',
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    }
  }
}

export default async function OpenHousePage(props: PageProps) {
  const params = await props.params
  const { mlsNumber } = parsePropertySlug(params.slug)
  const boardId = searchConfig.defaultBoardId

  let property: any
  try {
    property = await APIPropertyDetails.fetchProperty(mlsNumber, boardId)
  } catch (error) {
    console.error('Failed to fetch property:', error)
    notFound()
  }

  if (!property) {
    notFound()
  }

  const address = property.address
    ? `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zip}`
    : 'Address not available'

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back Link */}
      <Box sx={{ mb: 3 }}>
        <Link
          href={`/listing/${params.slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2">Back to Property Details</Typography>
        </Link>
      </Box>

      {/* Property Information Card */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stack spacing={3}>
          {/* Property Image */}
          {property.images?.[0]?.url && (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 300,
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Image
                src={property.images[0].url}
                alt={address}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </Box>
          )}

          {/* Property Details */}
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {formatPrice(property.price)}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {address}
            </Typography>

            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              {property.beds && (
                <Typography variant="body1">
                  <strong>{property.beds}</strong> Beds
                </Typography>
              )}
              {property.baths && (
                <Typography variant="body1">
                  <strong>{property.baths}</strong> Baths
                </Typography>
              )}
              {property.sqft && (
                <Typography variant="body1">
                  <strong>{property.sqft.toLocaleString()}</strong> Sq Ft
                </Typography>
              )}
            </Stack>

            {property.propertyType && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {property.propertyType}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              MLS# {property.mlsNumber}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Important Notice */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Welcome to our Open House!
        </Typography>
        <Typography variant="body2">
          Please complete the form below to sign in. This helps us stay in touch with you about
          this property and other homes that match your interests.
        </Typography>
      </Alert>

      {/* Open House Sign-In Form */}
      <OpenHouseForm propertyMls={property.mlsNumber} propertyAddress={address} />

      {/* Additional Information */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Questions about this property?{' '}
          <Link href="/contact" style={{ color: 'inherit' }}>
            Contact us
          </Link>
        </Typography>
      </Box>
    </Container>
  )
}
