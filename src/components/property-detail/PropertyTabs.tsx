'use client'

import React, { useState } from 'react'
import { Box, Tabs, Tab, Paper } from '@mui/material'
import { Property } from 'services/API'

import PropertyDescription from './PropertyDescription'
import PropertyKeyFacts from './PropertyKeyFacts'
import PropertyFeatures from './PropertyFeatures'
import PropertyHistory from './PropertyHistory'
import PropertyLocation from './PropertyLocation'
import PropertyMortgageCalculator from './PropertyMortgageCalculator'
import SimilarProperties from './SimilarProperties'
import RelatedPages from './RelatedPages'
import MoreProperties from './MoreProperties'
import RelatedBlogs from './RelatedBlogs'

interface PropertyTabsProps {
  property: Property
  similarProperties?: Property[]
  marketStats?: any
  defaultInterestRate?: number
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`property-tabpanel-${index}`}
      aria-labelledby={`property-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `property-tab-${index}`,
    'aria-controls': `property-tabpanel-${index}`,
  }
}

const PropertyTabs: React.FC<PropertyTabsProps> = ({
  property,
  similarProperties = [],
  marketStats,
  defaultInterestRate = 7.0
}) => {
  const [value, setValue] = useState(0)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  // Normalize price and sqft to numbers
  const price = typeof property.price === 'number' ? property.price : parseFloat(property.price || '0')
  const sqft = typeof property.sqft === 'number' ? property.sqft : parseFloat(property.sqft || '0')
  const pricePerSqft = price && sqft ? Math.round(price / sqft) : undefined

  // Map features to categorized format
  const features: Record<string, string[]> = property.features || {}

  // Property address
  const address = {
    street: property.address?.street || '',
    city: property.address?.city || '',
    state: property.address?.state || '',
    zip: property.address?.zip || '',
  }

  const propertyAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`

  const formatPrice = (priceValue: number | string | undefined): string => {
    const numPrice = typeof priceValue === 'number' ? priceValue : parseFloat(priceValue || '0')
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice)
  }

  // Get taxes and HOA as numbers
  const taxes = typeof property.taxes === 'number'
    ? property.taxes
    : property.taxes?.annualAmount || 0
  const hoa = typeof property.hoa === 'number'
    ? property.hoa
    : property.condominium?.fees?.maintenance
      ? parseFloat(property.condominium.fees.maintenance)
      : property.condominium?.maintenance
        ? parseFloat(property.condominium.maintenance)
        : 0

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="property details tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minWidth: { xs: 100, sm: 120 },
              px: { xs: 2, sm: 3 }
            },
            '& .Mui-selected': {
              color: 'primary.main',
              fontWeight: 600
            }
          }}
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Location" {...a11yProps(1)} />
          <Tab label="Mortgage" {...a11yProps(2)} />
          <Tab label="Similar Homes" {...a11yProps(3)} />
          <Tab label="Related" {...a11yProps(4)} />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={value} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Description */}
          {(property.description || property.details?.description) && (
            <PropertyDescription description={property.description || property.details?.description || ''} />
          )}

          {/* Key Facts */}
          <PropertyKeyFacts
            mlsNumber={property.mlsNumber || ''}
            propertyType={property.propertyType || property.details?.propertyType}
            status={property.status}
            yearBuilt={property.yearBuilt}
            lotSize={property.lotSize || property.lot?.acres || property.lot?.size}
            pricePerSqft={pricePerSqft}
            hoa={hoa}
            annualTaxes={taxes}
            daysOnMarket={property.daysOnMarket ? parseInt(property.daysOnMarket) : undefined}
          />

          {/* Features */}
          {Object.keys(features).length > 0 && (
            <PropertyFeatures features={features} />
          )}

          {/* Property History */}
          <PropertyHistory
            listingDate={property.listingDate || property.listDate}
            currentPrice={price}
            originalPrice={property.originalPrice
              ? (typeof property.originalPrice === 'number' ? property.originalPrice : parseFloat(property.originalPrice))
              : price}
            daysOnMarket={property.daysOnMarket}
          />
        </Box>
      </TabPanel>

      {/* Location Tab */}
      <TabPanel value={value} index={1}>
        <PropertyLocation
          address={address}
          coordinates={{
            latitude: property.map?.latitude || 0,
            longitude: property.map?.longitude || 0,
          }}
          neighborhood={property.neighborhood || property.address?.neighborhood}
          county={property.county || property.address?.district}
          schoolDistrict={property.schoolDistrict}
        />
      </TabPanel>

      {/* Mortgage Tab */}
      <TabPanel value={value} index={2}>
        <PropertyMortgageCalculator
          price={price}
          defaultInterestRate={defaultInterestRate}
          propertyTaxes={taxes}
          hoaFees={hoa}
        />
      </TabPanel>

      {/* Similar Homes Tab */}
      <TabPanel value={value} index={3}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {similarProperties.length > 0 ? (
            <>
              <SimilarProperties
                properties={similarProperties}
                currentPropertyMls={property.mlsNumber}
                city={property.address?.city}
                state={property.address?.state}
                address={propertyAddress}
                zipCode={property.address?.zip}
                propertyType={property.propertyType || property.details?.propertyType}
              />

              <MoreProperties
                properties={similarProperties}
                currentPropertyMls={property.mlsNumber}
                city={property.address?.city}
                state={property.address?.state}
                neighborhood={property.neighborhood || property.address?.neighborhood}
                priceRange={formatPrice(price)}
              />
            </>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              No similar properties found at this time.
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Related Tab */}
      <TabPanel value={value} index={4}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <RelatedPages
            city={property.address?.city}
            state={property.address?.state}
            neighborhood={property.neighborhood || property.address?.neighborhood}
            propertyType={property.propertyType || property.details?.propertyType}
            zipCode={property.address?.zip}
            schoolDistrict={property.schoolDistrict}
          />
        </Box>
      </TabPanel>
    </Box>
  )
}

export default PropertyTabs
