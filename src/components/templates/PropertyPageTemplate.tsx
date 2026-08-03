'use client'

import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

import { Box } from '@mui/material'

import PropertyDetailLayout from '@/components/property-detail/PropertyDetailLayout'
import { usePropertyViewTracking } from '@/hooks/useTrafficSource'

// The registration gate reuses the auth signup form (react-hook-form + Joi +
// libphonenumber). Load it only when it actually needs to show instead of
// shipping those libraries with every property page.
const PropertyRegistrationDialog = dynamic(
  () => import('@/components/shared/Dialogs/PropertyRegistrationDialog'),
  { ssr: false }
)

import { type HistoryItemType, type Property } from 'services/API'
import { useFeatures } from 'providers/FeaturesProvider'
import PropertyDetailsProvider from 'providers/PropertyDetailsProvider'
import PropertyProvider from 'providers/PropertyProvider'
import { useUser } from 'providers/UserProvider'

import PageTemplate from './PageTemplate'

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

  // Mount the registration dialog only once it first needs to show (its chunk
  // isn't downloaded until then), and keep it mounted afterwards so the close
  // animation still plays.
  const registrationEverShown = useRef(false)
  if (shouldShowRegistration) registrationEverShown.current = true

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
      {!user && registrationEverShown.current && (
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
