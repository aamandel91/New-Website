'use client'

import React, { useEffect, useMemo } from 'react'
import { Box, Container, Grid } from '@mui/material'
import { Property } from 'services/API'

import { useFavorites } from 'providers/FavoritesProvider'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { normalizeProperty } from 'utils/propertyDataMapper'

import PropertyPhotoGallery from './PropertyPhotoGallery'
import PropertyHeader from './PropertyHeader'
import PropertyBreadcrumbs from './PropertyBreadcrumbs'
import PropertyContactForm from './PropertyContactForm'
import PropertyTabs from './PropertyTabs'
import Property3DTour from './Property3DTour'
import HomeWorthCheckCTA from './HomeWorthCheckCTA'

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

  // Normalize property data for consistent field access
  const normalizedProperty = useMemo(() => normalizeProperty(property), [property])

  // Check if property is favorited
  const isFavorited = Boolean(findFavorite(property))

  // Track as recently viewed on mount
  useEffect(() => {
    addToRecentlyViewed(property)
  }, [property.mlsNumber])

  // Map property photos
  const photos = property.images?.map((img, index) => ({
    url: img.url || '',
    caption: img.caption,
    order: index,
  })) || []

  // Property address
  const address = {
    street: property.address?.street || '',
    city: property.address?.city || '',
    state: property.address?.state || '',
    zip: property.address?.zip || '',
  }

  const propertyAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`

  // Agent info
  const agent = property.agent
    ? {
        name: property.agent.name,
        phone: property.agent.phone,
        email: property.agent.email,
        photo: property.agent.photo,
        license: property.agent.license,
      }
    : undefined

  // Handle form submission
  const handleContactSubmit = async (formData: any) => {
    // TODO: Implement contact form submission
    console.log('Contact form submitted:', formData)
    // You can call your API here
    // await APIContact.submit(formData)
  }

  // Handle action buttons
  const handleSave = () => {
    toggleFavorite(property)
  }

  const handleShare = () => {
    console.log('Share property:', property.mlsNumber)
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: propertyAddress,
        text: `Check out this property: ${propertyAddress}`,
        url: window.location.href,
      })
    }
  }

  const handleRequestInfo = () => {
    console.log('Request info')
    // Scroll to contact form
    const contactForm = document.getElementById('contact-form')
    contactForm?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScheduleTour = () => {
    console.log('Schedule tour')
    // Scroll to contact form
    const contactForm = document.getElementById('contact-form')
    contactForm?.scrollIntoView({ behavior: 'smooth' })
  }

  // Get virtual tour URL
  const virtualTourUrl = normalizedProperty.virtualTourUrl

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Full-width Photo Gallery */}
      <PropertyPhotoGallery photos={photos} propertyAddress={propertyAddress} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <PropertyBreadcrumbs
          state={address.state}
          city={address.city}
          street={address.street}
        />

        {/* Property Header */}
        <Box sx={{ mb: 3 }}>
          <PropertyHeader
            price={normalizedProperty.price || 0}
            status={property.status || ''}
            address={address}
            beds={normalizedProperty.beds || 0}
            baths={normalizedProperty.baths || 0}
            sqft={normalizedProperty.sqft || 0}
            yearBuilt={normalizedProperty.yearBuilt}
            property={property}
            isSaved={isFavorited}
            onSave={handleSave}
            onShare={handleShare}
            onRequestInfo={handleRequestInfo}
            onScheduleTour={handleScheduleTour}
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
                property={normalizedProperty}
                similarProperties={similarProperties}
                marketStats={marketStats}
                defaultInterestRate={defaultInterestRate}
              />

              {/* Home Worth Check CTA */}
              <HomeWorthCheckCTA
                city={property.address?.city}
                state={property.address?.state}
              />
            </Box>
          </Grid>

          {/* Right Column - 1/3 width, Sticky */}
          <Grid item xs={12} lg={4}>
            <Box
              id="contact-form"
              sx={{
                position: { lg: 'sticky' },
                top: { lg: 80 },
                alignSelf: 'flex-start'
              }}
            >
              <PropertyContactForm
                propertyAddress={propertyAddress}
                agent={agent}
                onSubmit={handleContactSubmit}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default PropertyDetailLayout
