import React from 'react'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Link as MuiLink,
  Paper,
  Typography
} from '@mui/material'

import content from '@configs/content'
import Property404Template from '@/components/templates/Property404Template'
import PropertyPageTemplate from '@/components/templates/PropertyPageTemplate'
import {
  NotifyWhenListed,
  PropertyTransactionHistory
} from '@/components/property-detail'
import AboutTheArea from '@/components/property-detail/sections/AboutTheArea'
import { tenant } from '@/configs/tenant.config'
import { scorePropertyPage } from '@/utils/propertyPageScoring'
import StructuredData from '@shared/StructuredData'

import type { HistoryItemType, Property } from 'services/API'
import {
  generatePropertyBreadcrumbJsonLd,
  generatePropertyJsonLd
} from 'utils/propertySchema'
import { parseAddressSlug } from 'utils/propertyUrls'
import { getProtocolHost } from 'utils/urls'

import {
  fetchMarketStats,
  fetchSimilarProperties
} from '../../listing/[slug]/similarProperties'

import { fetchAddressListings } from './addressLookup'

export const revalidate = 300

// ─── Types ────────────────────────────────────────────────────────

type HomesPageProps = {
  params: Promise<{ slug: string }>
}

function categorizeListings(listings: Property[]) {
  const active = listings.find(
    (l) => l.status === 'A' && l.type?.toLowerCase() === 'sale'
  )
  const pending = listings.find(
    (l) =>
      l.status === 'A' &&
      (l.lastStatus === 'Sc' || l.lastStatus === 'Pc' || l.lastStatus === 'Lc')
  )
  const sold = listings
    .filter((l) => l.status === 'U' && l.lastStatus === 'Sld')
    .sort((a, b) => {
      const da = a.soldDate ? new Date(a.soldDate).getTime() : 0
      const db = b.soldDate ? new Date(b.soldDate).getTime() : 0
      return db - da
    })

  return { active, pending, mostRecentSold: sold[0], allSold: sold }
}

function buildHistory(listings: Property[]): HistoryItemType[] {
  const items: HistoryItemType[] = []
  for (const listing of listings) {
    // Add list event
    items.push({
      lastStatus: listing.lastStatus || 'New',
      listDate: listing.listDate,
      listPrice: listing.listPrice,
      mlsNumber: listing.mlsNumber,
      office: listing.office,
      soldDate: listing.soldDate as string | null,
      soldPrice: listing.soldPrice ? parseFloat(listing.soldPrice) : null,
      timestamps: listing.timestamps,
      type: listing.type,
      images: listing.images || []
    })

    // Also include inline history from individual listing
    if (listing.history) {
      for (const h of listing.history) {
        // Avoid duplicates by checking mlsNumber + lastStatus
        if (
          !items.some(
            (i) =>
              i.mlsNumber === h.mlsNumber &&
              i.lastStatus === h.lastStatus &&
              i.listDate === h.listDate
          )
        ) {
          items.push(h)
        }
      }
    }
  }
  return items
}

// ─── Metadata ─────────────────────────────────────────────────────

export async function generateMetadata(
  props: HomesPageProps
): Promise<Metadata> {
  const params = await props.params
  const parsed = parseAddressSlug(params.slug)

  if (!parsed) {
    return content.missingPropertyMetadata
  }

  const { street, city, state, zip } = parsed
  const titleStreet = street
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const titleCity = city
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const title = `${titleStreet}, ${titleCity}, ${state.toUpperCase()} ${zip}`
  const description = `View property details, price history, and market data for ${title}. Get notified when this home is listed for sale.`

  // Fetch property data for scoring
  const { listings } = await fetchAddressListings(params.slug)
  const { active, pending, mostRecentSold } = categorizeListings(listings)
  const primaryProperty = active || pending || mostRecentSold || listings[0]
  const history = buildHistory(listings)

  const pageScore = primaryProperty
    ? scorePropertyPage({
        status: primaryProperty.status,
        lastStatus: primaryProperty.lastStatus,
        soldDate: primaryProperty.soldDate ?? undefined,
        soldPrice: primaryProperty.soldPrice,
        images: primaryProperty.images,
        history,
        estimate: primaryProperty.estimate,
        details: primaryProperty.details
          ? { description: primaryProperty.details.description }
          : null,
        address: primaryProperty.address
          ? {
              city: primaryProperty.address.city,
              area: primaryProperty.address.area
            }
          : null
      })
    : null

  const ogImageUrl = `${tenant.brand.siteUrl}/api/og/property?slug=${encodeURIComponent(params.slug)}`

  return {
    title,
    description,
    ...(pageScore && { robots: pageScore.indexDirective }),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${tenant.brand.siteUrl}/homes/${params.slug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: `/homes/${params.slug}`
    }
  }
}

// ─── Page Component ───────────────────────────────────────────────

export default async function HomesPage(props: HomesPageProps) {
  const params = await props.params
  const { slug } = params

  const { listings, parsed } = await fetchAddressListings(slug)

  if (!parsed) {
    return (
      <Property404Template
        listingName={slug}
        properties={[]}
        error={new Error('Invalid address slug')}
      />
    )
  }

  const { street, city, state, zip } = parsed
  const titleStreet = street
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const titleCity = city
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const fullAddress = `${titleStreet}, ${titleCity}, ${state.toUpperCase()} ${zip}`

  const { active, pending, mostRecentSold, allSold } =
    categorizeListings(listings)
  const history = buildHistory(listings)

  // Primary property: active > pending > most recent sold > first listing found
  const primaryProperty = active || pending || mostRecentSold || listings[0]

  // Score the property for indexing decisions
  const pageScore = primaryProperty
    ? scorePropertyPage({
        status: primaryProperty.status,
        lastStatus: primaryProperty.lastStatus,
        soldDate: primaryProperty.soldDate ?? undefined,
        soldPrice: primaryProperty.soldPrice,
        images: primaryProperty.images,
        history,
        estimate: primaryProperty.estimate,
        details: primaryProperty.details
          ? { description: primaryProperty.details.description }
          : null,
        address: primaryProperty.address
          ? {
              city: primaryProperty.address.city,
              area: primaryProperty.address.area
            }
          : null
      })
    : null

  const host = getProtocolHost(await headers())
  const canonicalUrl = `${host}/homes/${slug}`

  // ─── Active listing: full PDP ──────────────────────────────────
  if (active) {
    const [similarProperties, marketStats] = await Promise.all([
      fetchSimilarProperties(active, 6).catch(() => []),
      active.address?.city && active.address?.state
        ? fetchMarketStats(
            active.address.city,
            active.address.state,
            active.boardId
          ).catch(() => null)
        : Promise.resolve(null)
    ])

    let propertyJsonLd = null
    let breadcrumbJsonLd = null
    try {
      propertyJsonLd = generatePropertyJsonLd(active, canonicalUrl)
      breadcrumbJsonLd = generatePropertyBreadcrumbJsonLd(active, host)
    } catch {
      /* graceful fallback */
    }

    return (
      <>
        {propertyJsonLd && <StructuredData data={propertyJsonLd} />}
        {breadcrumbJsonLd && <StructuredData data={breadcrumbJsonLd} />}
        <PropertyPageTemplate
          property={active}
          similarProperties={similarProperties}
          marketStats={marketStats}
          transactionHistory={history}
        />
        <Container
          maxWidth="xl"
          sx={{ pb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <AboutTheArea
            cityName={active.address?.city}
            coordinates={
              active.map?.latitude && active.map?.longitude
                ? { lat: active.map.latitude, lng: active.map.longitude }
                : undefined
            }
            variant="pdp"
          />
        </Container>
        {process.env.NODE_ENV === 'development' && pageScore && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              p: 1,
              borderRadius: 1,
              fontSize: 11,
              zIndex: 9999
            }}
          >
            Score: {pageScore.score} | {pageScore.indexDirective}
          </Box>
        )}
      </>
    )
  }

  // ─── Pending / under contract ──────────────────────────────────
  if (pending) {
    const [similarProperties, marketStats] = await Promise.all([
      fetchSimilarProperties(pending, 6).catch(() => []),
      pending.address?.city && pending.address?.state
        ? fetchMarketStats(
            pending.address.city,
            pending.address.state,
            pending.boardId
          ).catch(() => null)
        : Promise.resolve(null)
    ])

    let propertyJsonLd = null
    let breadcrumbJsonLd = null
    try {
      propertyJsonLd = generatePropertyJsonLd(pending, canonicalUrl)
      breadcrumbJsonLd = generatePropertyBreadcrumbJsonLd(pending, host)
    } catch {
      /* graceful fallback */
    }

    return (
      <>
        {propertyJsonLd && <StructuredData data={propertyJsonLd} />}
        {breadcrumbJsonLd && <StructuredData data={breadcrumbJsonLd} />}
        <Box
          sx={{
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            py: 1.5,
            textAlign: 'center'
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            UNDER CONTRACT
          </Typography>
        </Box>
        <PropertyPageTemplate
          property={pending}
          similarProperties={similarProperties}
          marketStats={marketStats}
          transactionHistory={history}
        />
        <Container
          maxWidth="xl"
          sx={{ pb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <NotifyWhenListed propertyAddress={fullAddress} />
          <AboutTheArea
            cityName={pending.address?.city}
            coordinates={
              pending.map?.latitude && pending.map?.longitude
                ? { lat: pending.map.latitude, lng: pending.map.longitude }
                : undefined
            }
            variant="pdp"
          />
        </Container>
        {process.env.NODE_ENV === 'development' && pageScore && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              p: 1,
              borderRadius: 1,
              fontSize: 11,
              zIndex: 9999
            }}
          >
            Score: {pageScore.score} | {pageScore.indexDirective}
          </Box>
        )}
      </>
    )
  }

  // ─── Sold (most recent transaction) ────────────────────────────
  if (mostRecentSold) {
    const estimate = mostRecentSold.estimate

    let breadcrumbJsonLd = null
    try {
      breadcrumbJsonLd = generatePropertyBreadcrumbJsonLd(mostRecentSold, host)
    } catch {
      /* graceful fallback */
    }

    const soldPrice = mostRecentSold.soldPrice
      ? parseFloat(mostRecentSold.soldPrice)
      : null
    const listPrice = mostRecentSold.listPrice
      ? parseFloat(mostRecentSold.listPrice)
      : null

    const citySlug = titleCity.toLowerCase().replace(/\s+/g, '-')

    return (
      <>
        {breadcrumbJsonLd && <StructuredData data={breadcrumbJsonLd} />}
        <AddressJsonLd address={fullAddress} url={canonicalUrl} />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Breadcrumbs */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <MuiLink href="/" color="inherit" underline="hover">
              Home
            </MuiLink>
            {' > '}
            <MuiLink href={`/${citySlug}`} color="inherit" underline="hover">
              {titleCity}
            </MuiLink>
            {' > '}
            {titleStreet}
          </Typography>

          {/* Sold banner */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Chip
              label="SOLD"
              color="error"
              size="small"
              sx={{ mb: 1, fontWeight: 700 }}
            />
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              gutterBottom
            >
              {fullAddress}
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {soldPrice
                ? `This home sold${mostRecentSold.soldDate ? ` on ${new Date(mostRecentSold.soldDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''} for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(soldPrice)}`
                : 'This home has been sold'}
            </Typography>
            {listPrice && soldPrice && (
              <Typography variant="body2" color="text.secondary">
                Original list price:{' '}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(listPrice)}
              </Typography>
            )}
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {/* Photos from last listing */}
              {mostRecentSold.images && mostRecentSold.images.length > 0 && (
                <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={mostRecentSold.images[0]}
                    alt={fullAddress}
                    sx={{ width: '100%', maxHeight: 400, objectFit: 'cover' }}
                  />
                </Paper>
              )}

              {/* Property details from last listing */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Property Details
                </Typography>
                <Grid container spacing={2}>
                  {mostRecentSold.details?.numBedrooms && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Bedrooms
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {mostRecentSold.details.numBedrooms}
                      </Typography>
                    </Grid>
                  )}
                  {mostRecentSold.details?.numBathrooms && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Bathrooms
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {mostRecentSold.details.numBathrooms}
                      </Typography>
                    </Grid>
                  )}
                  {mostRecentSold.details?.sqft && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Square Feet
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {parseInt(mostRecentSold.details.sqft).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {mostRecentSold.details?.yearBuilt && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Year Built
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {mostRecentSold.details.yearBuilt}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                {mostRecentSold.details?.description && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 2 }}
                    color="text.secondary"
                  >
                    {mostRecentSold.details.description}
                  </Typography>
                )}
              </Paper>

              {/* Estimated value */}
              {estimate && (
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Current Estimated Value
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(estimate.value)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Range:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(estimate.low)}
                    {' - '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(estimate.high)}
                  </Typography>
                </Paper>
              )}

              {/* Transaction history */}
              <PropertyTransactionHistory history={history} />
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Notify me */}
              <NotifyWhenListed propertyAddress={fullAddress} />

              {/* See similar homes CTA */}
              <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  See Similar Homes for Sale
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Browse active listings in {titleCity}.
                </Typography>
                <Button variant="contained" fullWidth href={`/${citySlug}`}>
                  Homes for Sale in {titleCity}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
        {process.env.NODE_ENV === 'development' && pageScore && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              p: 1,
              borderRadius: 1,
              fontSize: 11,
              zIndex: 9999
            }}
          >
            Score: {pageScore.score} | {pageScore.indexDirective}
          </Box>
        )}
      </>
    )
  }

  // ─── Off-market / no listing found ─────────────────────────────
  const citySlug = titleCity.toLowerCase().replace(/\s+/g, '-')

  // Try to get details from any historical listing
  const anyListing = listings[0]
  const estimate = anyListing?.estimate

  return (
    <>
      <AddressJsonLd address={fullAddress} url={canonicalUrl} />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <MuiLink href="/" color="inherit" underline="hover">
            Home
          </MuiLink>
          {' > '}
          <MuiLink href={`/${citySlug}`} color="inherit" underline="hover">
            {titleCity}
          </MuiLink>
          {' > '}
          {titleStreet}
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Chip
            label="OFF MARKET"
            size="small"
            sx={{ mb: 1, fontWeight: 700 }}
          />
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            {fullAddress}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            This property is not currently listed for sale.
          </Alert>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Property details from any historical listing */}
            {anyListing && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Property Details
                </Typography>
                <Grid container spacing={2}>
                  {anyListing.details?.numBedrooms && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Bedrooms
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {anyListing.details.numBedrooms}
                      </Typography>
                    </Grid>
                  )}
                  {anyListing.details?.numBathrooms && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Bathrooms
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {anyListing.details.numBathrooms}
                      </Typography>
                    </Grid>
                  )}
                  {anyListing.details?.sqft && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Square Feet
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {parseInt(anyListing.details.sqft).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {anyListing.details?.yearBuilt && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Year Built
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {anyListing.details.yearBuilt}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Estimated value */}
            {estimate && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Estimated Value
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  }).format(estimate.value)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Range:{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  }).format(estimate.low)}
                  {' - '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  }).format(estimate.high)}
                </Typography>
              </Paper>
            )}

            {/* Transaction history */}
            {history.length > 0 && (
              <PropertyTransactionHistory history={history} />
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Notify me */}
            <NotifyWhenListed propertyAddress={fullAddress} />

            {/* CTA */}
            <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Homes for Sale in {titleCity}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Browse all active listings in {titleCity}.
              </Typography>
              <Button variant="contained" fullWidth href={`/${citySlug}`}>
                See Homes for Sale
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      {process.env.NODE_ENV === 'development' && pageScore && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 10,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            p: 1,
            borderRadius: 1,
            fontSize: 11,
            zIndex: 9999
          }}
        >
          Score: {pageScore.score} | {pageScore.indexDirective}
        </Box>
      )}
    </>
  )
}

// ─── Inline helper: minimal address schema ────────────────────────

function AddressJsonLd({ address, url }: { address: string; url: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: address,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressCountry: 'US'
    }
  }
  return <StructuredData data={data} />
}
