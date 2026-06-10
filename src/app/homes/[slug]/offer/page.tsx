import React from 'react'
import type { Metadata } from 'next'

import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  Typography
} from '@mui/material'

import { fetchAddressListings, findActiveListing } from '../addressLookup'

import OfferWizard from './OfferWizard'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  return {
    title: 'Start an Offer',
    alternates: { canonical: `/homes/${params.slug}/offer` },
    robots: { index: false, follow: false }
  }
}

export default async function OfferPage(props: PageProps) {
  const params = await props.params
  const { slug } = params

  const { listings, parsed } = await fetchAddressListings(slug)
  const active = findActiveListing(listings)

  if (!parsed) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Property Not Found
            </Typography>
            <Alert severity="warning">
              The address in this URL could not be parsed.
            </Alert>
            <Button variant="contained" href="/homes">
              Browse Florida Homes for Sale
            </Button>
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

  if (!active) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              This listing is no longer available
            </Typography>
            <Alert severity="info">
              {fullAddress} is not currently active on the market, so we
              can&apos;t accept an offer for it at this time.
            </Alert>
            <Button variant="contained" href={`/homes/${slug}`}>
              Back to Property Details
            </Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <OfferWizard
      address={fullAddress}
      mlsNumber={active.mlsNumber}
      backHref={`/homes/${slug}`}
    />
  )
}
