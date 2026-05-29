import React from 'react'
import type { Metadata } from 'next'
import { Container, Box, Typography, Paper, Stack, Alert, Button } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import OpenHouseForm from 'components/open-house/OpenHouseForm'
import { fetchAddressListings, findActiveListing } from '../addressLookup'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

// Force noindex, nofollow for all open house pages
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const { listings, parsed } = await fetchAddressListings(params.slug)
  const active = findActiveListing(listings)

  const titleStreet = parsed
    ? parsed.street
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : ''
  const titleCity = parsed
    ? parsed.city
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : ''
  const fullAddress =
    parsed && titleStreet
      ? `${titleStreet}, ${titleCity}, ${parsed.state.toUpperCase()}`
      : 'Property'

  return {
    title: `Open House Sign-In - ${fullAddress}`,
    description: active
      ? `Sign in to our open house at ${fullAddress}`
      : 'Open house sign-in',
    alternates: { canonical: `/homes/${params.slug}/openhouse` },
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  }
}

export default async function OpenHousePage(props: PageProps) {
  const params = await props.params
  const { slug } = params

  const { listings, parsed } = await fetchAddressListings(slug)

  if (!parsed) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Property Not Found
            </Typography>
            <Alert severity="warning">
              The address in this URL could not be parsed.
            </Alert>
            <Button variant="contained" href="/homes">Browse Florida Homes for Sale</Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  const titleStreet = parsed.street
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const titleCity = parsed.city
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const fullAddress = `${titleStreet}, ${titleCity}, ${parsed.state.toUpperCase()} ${parsed.zip}`

  const active = findActiveListing(listings)

  if (!active) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              No upcoming open houses
            </Typography>
            <Alert severity="info">
              {fullAddress} is not currently listed for sale, so there are no
              upcoming open houses to sign in for.
            </Alert>
            <Button variant="contained" href={`/homes/${slug}`}>
              Back to Property Details
            </Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  const propertyAny = active as unknown as {
    images?: { url: string }[] | string[]
    listPrice?: number | string
    details?: {
      numBedrooms?: number | string
      numBathrooms?: number | string
      sqft?: number | string
      propertyType?: string
    }
    mlsNumber: string
  }

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return 'N/A'
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (!num) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Resolve hero image: support images as either array of URL strings or
  // array of `{ url }` objects (Repliers shape varies by board).
  const heroImage = (() => {
    const imgs = propertyAny.images
    if (!imgs || imgs.length === 0) return null
    const first = imgs[0]
    if (typeof first === 'string') return first
    if (typeof first === 'object' && 'url' in first) return first.url
    return null
  })()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back Link */}
      <Box sx={{ mb: 3 }}>
        <Link
          href={`/homes/${slug}`}
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
          {heroImage && (
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
                src={heroImage}
                alt={fullAddress}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </Box>
          )}

          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {formatPrice(propertyAny.listPrice)}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {fullAddress}
            </Typography>

            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              {propertyAny.details?.numBedrooms && (
                <Typography variant="body1">
                  <strong>{propertyAny.details.numBedrooms}</strong> Beds
                </Typography>
              )}
              {propertyAny.details?.numBathrooms && (
                <Typography variant="body1">
                  <strong>{propertyAny.details.numBathrooms}</strong> Baths
                </Typography>
              )}
              {propertyAny.details?.sqft && (
                <Typography variant="body1">
                  <strong>{propertyAny.details.sqft.toLocaleString()}</strong> Sq Ft
                </Typography>
              )}
            </Stack>

            {propertyAny.details?.propertyType && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {propertyAny.details.propertyType}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              MLS# {propertyAny.mlsNumber}
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
      <OpenHouseForm propertyMls={propertyAny.mlsNumber} propertyAddress={fullAddress} />

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
