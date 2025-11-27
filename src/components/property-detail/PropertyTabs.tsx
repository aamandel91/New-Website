'use client'

import React, { useState } from 'react'
import { Box, Tabs, Tab, Paper } from '@mui/material'
import { Property } from 'services/API'

import PropertyDescription from './PropertyDescription'
import PropertyKeyFacts from './PropertyKeyFacts'
import PropertyFeatures from './PropertyFeatures'
import PropertyHistory from './PropertyHistory'
import PropertyLocation from './PropertyLocation'
import PropertyComparables from './PropertyComparables'
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

  // Parse price and sqft from API data
  const price = property.listPrice ? parseFloat(property.listPrice) : 0
  const sqft = property.details?.sqft ? parseFloat(property.details.sqft) : 0
  const pricePerSqft = price && sqft ? Math.round(price / sqft) : undefined

  // Map features from details - build categorized format
  const features: Record<string, string[]> = {}

  if (property.details) {
    // Interior features
    const interior: string[] = []
    if (property.details.airConditioning) interior.push(`Air Conditioning: ${property.details.airConditioning}`)
    if (property.details.heating) interior.push(`Heating: ${property.details.heating}`)
    if (property.details.basement1) interior.push(`Basement: ${property.details.basement1}`)
    if (property.details.numFireplaces) interior.push(`Fireplaces: ${property.details.numFireplaces}`)
    if (property.details.flooringType) interior.push(`Flooring: ${property.details.flooringType}`)
    if (interior.length > 0) features['Interior'] = interior

    // Exterior features
    const exterior: string[] = []
    if (property.details.exteriorConstruction1) exterior.push(`Construction: ${property.details.exteriorConstruction1}`)
    if (property.details.driveway) exterior.push(`Driveway: ${property.details.driveway}`)
    if (property.details.garage) exterior.push(`Garage: ${property.details.garage}`)
    if (property.details.patio) exterior.push(`Patio: ${property.details.patio}`)
    if (property.details.swimmingPool) exterior.push(`Pool: ${property.details.swimmingPool}`)
    if (exterior.length > 0) features['Exterior'] = exterior

    // Parking
    const parking: string[] = []
    if (property.details.numGarageSpaces) parking.push(`Garage Spaces: ${property.details.numGarageSpaces}`)
    if (property.details.numParkingSpaces) parking.push(`Parking Spaces: ${property.details.numParkingSpaces}`)
    if (parking.length > 0) features['Parking'] = parking

    // Utilities
    const utilities: string[] = []
    if (property.details.waterSource) utilities.push(`Water: ${property.details.waterSource}`)
    if (property.details.sewer) utilities.push(`Sewer: ${property.details.sewer}`)
    if (utilities.length > 0) features['Utilities'] = utilities

    // Additional features
    if (property.details.extras) {
      features['Additional Features'] = property.details.extras.split(',').map(s => s.trim())
    }
  }

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

  // Get taxes and HOA from API structure
  const taxes = property.taxes?.annualAmount
    ? parseFloat(property.taxes.annualAmount)
    : 0
  const hoa = property.condominium?.fees?.maintenance
    ? parseFloat(property.condominium.fees.maintenance)
    : property.condominium?.maintenance
      ? parseFloat(property.condominium.maintenance)
      : 0

  // Tab indices - adjust based on whether comparables exist
  const hasComparables = property.comparables && property.comparables.length > 0
  const tabIndices = {
    overview: 0,
    location: 1,
    comparables: hasComparables ? 2 : -1,
    mortgage: hasComparables ? 3 : 2,
    similarHomes: hasComparables ? 4 : 3,
    related: hasComparables ? 5 : 4
  }

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
          <Tab label="Overview" {...a11yProps(tabIndices.overview)} />
          <Tab label="Location" {...a11yProps(tabIndices.location)} />
          {hasComparables && (
            <Tab label="Comparables" {...a11yProps(tabIndices.comparables)} />
          )}
          <Tab label="Mortgage" {...a11yProps(tabIndices.mortgage)} />
          <Tab label="Similar Homes" {...a11yProps(tabIndices.similarHomes)} />
          <Tab label="Related" {...a11yProps(tabIndices.related)} />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={value} index={tabIndices.overview}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Description */}
          {(property.description || property.details?.description) && (
            <PropertyDescription description={property.description || property.details?.description || ''} />
          )}

          {/* Key Facts */}
          <PropertyKeyFacts
            mlsNumber={property.mlsNumber || ''}
            propertyType={property.details?.propertyType}
            status={property.status}
            yearBuilt={property.details?.yearBuilt ? parseInt(property.details.yearBuilt) : undefined}
            lotSize={property.lot?.acres || property.lot?.size}
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
      <TabPanel value={value} index={tabIndices.location}>
        <PropertyLocation
          address={address}
          coordinates={{
            latitude: property.map?.latitude || 0,
            longitude: property.map?.longitude || 0,
          }}
          neighborhood={property.address?.neighborhood}
          county={property.address?.district}
          schoolDistrict={undefined}
        />
      </TabPanel>

      {/* Comparables Tab */}
      {hasComparables && (
        <TabPanel value={value} index={tabIndices.comparables}>
          <PropertyComparables
            comparables={property.comparables || []}
            currentProperty={property}
          />
        </TabPanel>
      )}

      {/* Mortgage Tab */}
      <TabPanel value={value} index={tabIndices.mortgage}>
        <PropertyMortgageCalculator
          price={price}
          defaultInterestRate={defaultInterestRate}
          propertyTaxes={taxes}
          hoaFees={hoa}
        />
      </TabPanel>

      {/* Similar Homes Tab */}
      <TabPanel value={value} index={tabIndices.similarHomes}>
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
                propertyType={property.details?.propertyType}
              />

              <MoreProperties
                properties={similarProperties}
                currentPropertyMls={property.mlsNumber}
                city={property.address?.city}
                state={property.address?.state}
                neighborhood={property.address?.neighborhood}
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
      <TabPanel value={value} index={tabIndices.related}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <RelatedPages
            city={property.address?.city}
            state={property.address?.state}
            neighborhood={property.address?.neighborhood}
            propertyType={property.details?.propertyType}
            zipCode={property.address?.zip}
            schoolDistrict={undefined}
          />
        </Box>
      </TabPanel>
    </Box>
  )
}

export default PropertyTabs
