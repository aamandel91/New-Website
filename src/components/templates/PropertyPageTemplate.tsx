'use client'

import React, { useEffect } from 'react'

import { Box } from '@mui/material'

import { PropertyDetailLayout } from '@/components/property-detail'

import { type Property } from 'services/API'
import { useFeatures } from 'providers/FeaturesProvider'
import PropertyDetailsProvider from 'providers/PropertyDetailsProvider'
import PropertyProvider from 'providers/PropertyProvider'
import { useUser } from 'providers/UserProvider'
import { usePropertyViewTracking } from '@/hooks/useTrafficSource'
import PropertyRegistrationDialog from '@/components/shared/Dialogs/PropertyRegistrationDialog'

import { PageTemplate } from '.'

interface PropertyPageTemplateProps {
  property: Property
  similarProperties?: Property[]
  marketStats?: any
}

const PropertyPageTemplate = ({
  property,
  similarProperties,
  marketStats
}: PropertyPageTemplateProps) => {
  const features = useFeatures()
  const noHeader = !features.pdpHeader
  const { user } = useUser()

  const {
    shouldShowRegistration,
    trackPropertyView,
    dismissRegistration,
    isRequiredRegistration,
  } = usePropertyViewTracking()

  // Track property view on mount
  useEffect(() => {
    if (!user) {
      trackPropertyView()
    }
  }, [user])

  const propertyAddress = property.address
    ? `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zip}`
    : 'this property'

  return (
    <PageTemplate noHeader={noHeader}>
      <PropertyProvider property={property}>
        <PropertyDetailsProvider property={property}>
          <PropertyDetailLayout
            property={property}
            similarProperties={similarProperties}
            marketStats={marketStats}
          />
        </PropertyDetailsProvider>
      </PropertyProvider>

      {/* Show registration modal for non-authenticated users */}
      {!user && (
        <PropertyRegistrationDialog
          open={shouldShowRegistration}
          onClose={dismissRegistration}
          isRequired={isRequiredRegistration}
          propertyAddress={propertyAddress}
        />
      )}
    </PageTemplate>
  )
}

export default PropertyPageTemplate
