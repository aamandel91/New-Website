'use client'

import React from 'react'
import { Box, Container, Grid } from '@mui/material'
import { Property } from 'services/API'

import PropertyPhotoGallery from './PropertyPhotoGallery'
import PropertyHeader from './PropertyHeader'
import PropertyDescription from './PropertyDescription'
import PropertyKeyFacts from './PropertyKeyFacts'
import PropertyFeatures from './PropertyFeatures'
import PropertyContactForm from './PropertyContactForm'

interface PropertyDetailLayoutProps {
  property: Property
}

const PropertyDetailLayout: React.FC<PropertyDetailLayoutProps> = ({ property }) => {
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

  // Calculate price per sqft
  const pricePerSqft = property.price && property.sqft
    ? Math.round(property.price / property.sqft)
    : undefined

  // Map features to categorized format
  const features: Record<string, string[]> = {}

  // Example mapping - adjust based on your API structure
  if (property.features) {
    Object.entries(property.features).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        features[key] = value
      } else if (typeof value === 'string') {
        if (!features['General']) features['General'] = []
        features['General'].push(`${key}: ${value}`)
      }
    })
  }

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
    console.log('Save property:', property.mlsNumber)
    // TODO: Implement save functionality
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

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Full-width Photo Gallery */}
      <PropertyPhotoGallery photos={photos} propertyAddress={propertyAddress} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Property Header */}
        <PropertyHeader
          price={property.price || 0}
          status={property.status || ''}
          address={address}
          beds={property.beds || 0}
          baths={property.baths || 0}
          sqft={property.sqft || 0}
          yearBuilt={property.yearBuilt}
          property={property}
          onSave={handleSave}
          onShare={handleShare}
          onRequestInfo={handleRequestInfo}
          onScheduleTour={handleScheduleTour}
        />

        {/* Two-Column Layout */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* Left Column - 2/3 width */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Description */}
              {property.description && (
                <PropertyDescription description={property.description} />
              )}

              {/* Key Facts */}
              <PropertyKeyFacts
                mlsNumber={property.mlsNumber || ''}
                propertyType={property.propertyType}
                status={property.status}
                yearBuilt={property.yearBuilt}
                lotSize={property.lotSize}
                pricePerSqft={pricePerSqft}
                hoa={property.hoa}
                annualTaxes={property.taxes}
              />

              {/* Features */}
              {Object.keys(features).length > 0 && (
                <PropertyFeatures features={features} />
              )}

              {/* TODO: Add PropertyHistory component */}
              {/* TODO: Add PropertyLocation component with map */}
              {/* TODO: Add Similar Properties section */}
            </Box>
          </Grid>

          {/* Right Column - 1/3 width, Sticky */}
          <Grid item xs={12} lg={4}>
            <Box id="contact-form">
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
