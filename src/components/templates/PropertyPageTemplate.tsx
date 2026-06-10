'use client'

import React, { useEffect } from 'react'

import { Box } from '@mui/material'

import { PropertyDetailLayout } from '@/components/property-detail'
import PropertyRegistrationDialog from '@/components/shared/Dialogs/PropertyRegistrationDialog'
import { usePropertyViewTracking } from '@/hooks/useTrafficSource'

import { type HistoryItemType, type Property } from 'services/API'
import { useFeatures } from 'providers/FeaturesProvider'
import PropertyDetailsProvider from 'providers/PropertyDetailsProvider'
import PropertyProvider from 'providers/PropertyProvider'
import { useUser } from 'providers/UserProvider'

import { PageTemplate } from '.'

interface PropertyPageTemplateProps {
  property: Property
  similarProperties?: Property[]
  marketStats?: any
  transactionHistory?: HistoryItemType[]
}

const PropertyPageTemplate = ({
  property,
  similarProperties,
  marketStats,
  transactionHistory
}: PropertyPageTemplateProps) => {
  const features = useFeatures()
  const noHeader = !features.pdpHeader
  const { profile: user } = useUser()

  const {
    shouldShowRegistration,
    trackPropertyView,
    dismissRegistration,
    isRequiredRegistration
  } = usePropertyViewTracking()

  // Track property view on mount
  useEffect(() => {
    if (!user) {
      trackPropertyView()
    }
  }, [user])

  const propertyAddress = property.address
    ? `${[property.address.streetNumber, property.address.streetName, property.address.streetSuffix].filter(Boolean).join(' ')}, ${property.address.city}, ${property.address.state} ${property.address.zip}`
    : 'this property'

  return (
    <PageTemplate noHeader={noHeader}>
      <PropertyProvider property={property}>
        <PropertyDetailsProvider property={property}>
          <PropertyDetailLayout
            property={property}
            similarProperties={similarProperties}
            marketStats={marketStats}
            transactionHistory={transactionHistory}
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
