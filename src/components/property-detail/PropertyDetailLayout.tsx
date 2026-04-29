'use client'

import React, { useEffect, useState } from 'react'

import { Box, Container, Grid, Snackbar } from '@mui/material'

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { trackPropertyView } from '@/utils/analytics'
import { ssTrackPropertyView, ssTrackSavedProperty } from '@/utils/suresendTracking'

import type { Property } from 'services/API'
import { useFavorites } from 'providers/FavoritesProvider'
import { useFeatures } from 'providers/FeaturesProvider'

import CommunityLink from './CommunityLink'
import ExploreMore from './ExploreMore'
import HiddenPropertyDescription from './HiddenPropertyDescription'
import HomeWorthCheckCTA from './HomeWorthCheckCTA'
import MobileContactBar from './MobileContactBar'
import Property3DTour from './Property3DTour'
import PropertyBreadcrumbs from './PropertyBreadcrumbs'
import PropertyContactForm from './PropertyContactForm'
import PropertyHeader from './PropertyHeader'
import PropertyNotifications from './PropertyNotifications'
import PropertyPhotoGallery from './PropertyPhotoGallery'
import PreferredLender from './PreferredLender'
import ViewOtherUnits from './ViewOtherUnits'
import { getCDNPath } from 'utils/urls'
import PropertyTabs from './PropertyTabs'

interface PropertyDetailLayoutProps {
  property: Property
  similarProperties?: Property[]
  marketStats?: any
  defaultInterestRate?: number
}

const PropertyDetailLayout: React.FC<PropertyDetailLayoutProps> = ({
  property,
  similarProperties = [],
  marketStats,
  defaultInterestRate = 7.0
}) => {
  const { toggle: toggleFavorite, find: findFavorite } = useFavorites()
  const { addProperty: addToRecentlyViewed } = useRecentlyViewed()
  const features = useFeatures()
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  // Check if property is favorited
  const isFavorited = Boolean(findFavorite(property))

  // Track as recently viewed on mount
  useEffect(() => {
    addToRecentlyViewed(property)
    trackPropertyView(property)

    const street = `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}`.trim()
    ssTrackPropertyView({
      mlsNumber: property.mlsNumber,
      street,
      city: property.address?.city || '',
      state: property.address?.state || '',
      zipCode: property.address?.zip || '',
      price: property.listPrice ? parseFloat(property.listPrice) : 0,
      bedrooms: property.details?.numBedrooms || '0',
      bathrooms: property.details?.numBathrooms || '0',
      squareFeet: property.details?.sqft || '0',
      lotSize: property.lot?.acres?.toString() || '',
      propertyType: property.details?.propertyType || '',
      forRent: false,
    })
  }, [property.mlsNumber])

  // Map property photos - images is an array of strings
  const photos =
    property.images?.map((imgUrl, index) => ({
      url: imgUrl ? (imgUrl.startsWith('http') ? imgUrl : getCDNPath(imgUrl, 'large')) : '',
      caption: undefined,
      order: index
    })) || []

  // Property address
  const address = {
    street:
      `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}`.trim(),
    city: property.address?.city || '',
    state: property.address?.state || '',
    zip: property.address?.zip || ''
  }

  const propertyAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`

  // Parse property data from API
  const price = property.listPrice ? parseFloat(property.listPrice) : 0
  const beds = property.details?.numBedrooms
    ? parseInt(property.details.numBedrooms)
    : 0
  const baths = property.details?.numBathrooms
    ? parseInt(property.details.numBathrooms)
    : 0
  const sqft = property.details?.sqft ? parseFloat(property.details.sqft) : 0
  const yearBuilt = property.details?.yearBuilt
    ? parseInt(property.details.yearBuilt)
    : undefined

  // Agent info - use first agent from agents array
  const agent =
    property.agents && property.agents.length > 0
      ? {
          name: property.agents[0].name || undefined,
          phone:
            property.agents[0].phones && property.agents[0].phones.length > 0
              ? String(property.agents[0].phones[0])
              : undefined,
          email: undefined,
          photo:
            property.agents[0].photo?.large || property.agents[0].photo?.small,
          license: undefined
        }
      : undefined

  // Handle form submission
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleContactSubmit = async (_formData: any) => {
    // TODO: Implement contact form submission via APIContact.submit(formData)
  }

  // Handle action buttons
  const handleSave = () => {
    const favoriteId = findFavorite(property)
    if (!favoriteId) {
      const street = `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}`.trim()
      ssTrackSavedProperty({
        mlsNumber: property.mlsNumber,
        street,
        city: property.address?.city || '',
        state: property.address?.state || '',
        zipCode: property.address?.zip || '',
        price: property.listPrice ? parseFloat(property.listPrice) : 0,
      })
    }
    toggleFavorite(property)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyAddress,
          text: `Check out this property: ${propertyAddress}`,
          url
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setSnackbarOpen(true)
    } catch {
      // Clipboard API unavailable
    }
  }

  const handleRequestInfo = () => {
    // Scroll to contact form
    const contactForm = document.getElementById('contact-form')
    contactForm?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScheduleTour = () => {
    // Scroll to contact form
    const contactForm = document.getElementById('contact-form')
    contactForm?.scrollIntoView({ behavior: 'smooth' })
  }

  // Get virtual tour URL
  const virtualTourUrl = property.details?.virtualTourUrl

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hidden Property Description for SEO */}
      <HiddenPropertyDescription
        description={property.details?.description || ''}
        enabled={features.hiddenPropertyDescription}
      />

      {/* Full-width Photo Gallery */}
      <PropertyPhotoGallery photos={photos} propertyAddress={propertyAddress} />

      <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, lg: 4 } }}>
        {/* Breadcrumbs */}
        <PropertyBreadcrumbs
          state={address.state}
          city={address.city}
          street={address.street}
          county={property.address?.district}
          neighborhood={property.address?.neighborhood}
          zip={property.address?.zip}
        />

        {/* Property Header */}
        <Box sx={{ mb: 3 }}>
          <PropertyHeader
            price={price}
            status={property.status || ''}
            address={address}
            beds={beds}
            baths={baths}
            sqft={sqft}
            yearBuilt={yearBuilt}
            property={property}
            isSaved={isFavorited}
            onSave={handleSave}
            onShare={handleShare}
            onRequestInfo={handleRequestInfo}
            onScheduleTour={handleScheduleTour}
          />
          <ViewOtherUnits
            streetName={property.address?.streetName || ''}
            streetNumber={property.address?.streetNumber || ''}
            city={property.address?.city || ''}
            currentMls={property.mlsNumber}
            propertyType={property.details?.propertyType}
          />
        </Box>

        {/* Two-Column Layout */}
        <Grid container spacing={4}>
          {/* Left Column - 2/3 width */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 3D Tour */}
              {virtualTourUrl && (
                <Property3DTour
                  virtualTourUrl={virtualTourUrl}
                  propertyAddress={propertyAddress}
                />
              )}

              {/* Tab-based Content */}
              <PropertyTabs
                property={property}
                similarProperties={similarProperties}
                marketStats={marketStats}
                defaultInterestRate={defaultInterestRate}
              />

              {/* Community Information Link */}
              <CommunityLink
                city={property.address?.city}
                state={property.address?.state}
                county={property.address?.district}
              />

              {/* Explore More Suggestions */}
              <ExploreMore
                property={property}
                similarProperties={similarProperties}
              />

              {/* Home Worth Check CTA */}
              <HomeWorthCheckCTA
                city={property.address?.city}
                state={property.address?.state}
              />
            </Box>
          </Grid>

          {/* Right Column - 1/3 width, Sticky (desktop only) */}
          <Grid
            item
            xs={12}
            lg={4}
            sx={{ display: { xs: 'none', lg: 'block' } }}
          >
            <Box
              id="contact-form"
              sx={{
                position: { lg: 'sticky' },
                top: { lg: 80 },
                alignSelf: 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <PropertyContactForm
                propertyAddress={propertyAddress}
                agent={agent}
                onSubmit={handleContactSubmit}
              />
              <PropertyNotifications
                propertyAddress={propertyAddress}
                mlsNumber={property.mlsNumber}
                city={address.city}
                neighborhood={property.address?.neighborhood}
              />
              <PreferredLender />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Property Notifications */}
      <Container maxWidth="xl" sx={{ display: { xs: 'block', lg: 'none' }, pb: 2 }}>
        <PropertyNotifications
          propertyAddress={propertyAddress}
          mlsNumber={property.mlsNumber}
          city={address.city}
          neighborhood={property.address?.neighborhood}
        />
      </Container>

      {/* Mobile Sticky Contact Bar + Modal */}
      <MobileContactBar
        propertyAddress={propertyAddress}
        agent={agent}
        onSubmit={handleContactSubmit}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Link copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}

export default PropertyDetailLayout
