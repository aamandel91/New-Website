'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Box, Tabs, Tab, Skeleton } from '@mui/material'
import type { Property } from 'services/API'

import PropertyDescription from './PropertyDescription'
import PropertyKeyFacts from './PropertyKeyFacts'
import PropertyValueEstimate from './PropertyValueEstimate'
import PropertyFeatures from './PropertyFeatures'
import PropertyNarrative from './PropertyNarrative'
import PropertyHistory from './PropertyHistory'
import PropertyTaxHistory from './PropertyTaxHistory'
import PropertyNeighborhood from './PropertyNeighborhood'
import PropertyMarketStats from './PropertyMarketStats'
import SimilarProperties from './SimilarProperties'
import RelatedPages from './RelatedPages'
import MoreProperties from './MoreProperties'
import RelatedBlogs from './RelatedBlogs'
import PropertyPublicRecords from './PropertyPublicRecords'

const EstimateHistoryTable = dynamic(() => import('./EstimateHistoryTable'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

const SoldPriceDistribution = dynamic(() => import('./SoldPriceDistribution'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

const CompareToMyHome = dynamic(() => import('./CompareToMyHome'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

const PropertyLocation = dynamic(() => import('./PropertyLocation'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />,
})

const PropertyComparables = dynamic(() => import('./PropertyComparables'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />,
})

const PropertyMortgageCalculator = dynamic(() => import('./PropertyMortgageCalculator'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 1 }} />,
})

const CashFlowCalculator = dynamic(() => import('./CashFlowCalculator'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />,
})

const CommuteCalculator = dynamic(() => import('./CommuteCalculator'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

const NearbyPlaces = dynamic(() => import('./NearbyPlaces'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

const WalkScore = dynamic(() => import('./WalkScore'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />,
})

interface PropertyTabsProps {
  property: Property
  similarProperties?: Property[]
  marketStats?: any
  defaultInterestRate?: number
}

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'location', label: 'Location' },
  { id: 'mortgage', label: 'Mortgage' },
  { id: 'similar', label: 'Similar Homes' },
] as const

const PropertyTabs: React.FC<PropertyTabsProps> = ({
  property,
  similarProperties = [],
  marketStats,
  defaultInterestRate = 7.0
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const isScrollingRef = useRef(false)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setSectionRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el)
    } else {
      sectionRefs.current.delete(id)
    }
  }, [])

  // IntersectionObserver to highlight active tab based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = SECTIONS.findIndex((s) => s.id === entry.target.id)
            if (idx !== -1) {
              setActiveTab(idx)
            }
          }
        }
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: 0,
      }
    )

    // Small delay to let sections mount
    const timer = setTimeout(() => {
      SECTIONS.forEach(({ id }) => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const handleTabClick = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    const section = SECTIONS[newValue]
    const el = document.getElementById(section.id)
    if (el) {
      isScrollingRef.current = true
      el.scrollIntoView({ behavior: 'smooth' })
      // Re-enable observer after scroll settles
      setTimeout(() => {
        isScrollingRef.current = false
      }, 800)
    }
  }

  // Parse price and sqft from API data
  const price = property.listPrice ? parseFloat(property.listPrice) : 0
  const sqft = property.details?.sqft ? parseFloat(property.details.sqft) : 0
  const pricePerSqft = price && sqft ? Math.round(price / sqft) : undefined

  // Map features from details - build categorized format
  const features: Record<string, string[]> = {}

  if (property.details) {
    const interior: string[] = []
    if (property.details.airConditioning) interior.push(`Air Conditioning: ${property.details.airConditioning}`)
    if (property.details.heating) interior.push(`Heating: ${property.details.heating}`)
    if (property.details.basement1) interior.push(`Basement: ${property.details.basement1}`)
    if (property.details.numFireplaces) interior.push(`Fireplaces: ${property.details.numFireplaces}`)
    if (property.details.flooringType) interior.push(`Flooring: ${property.details.flooringType}`)
    if (interior.length > 0) features['Interior'] = interior

    const exterior: string[] = []
    if (property.details.exteriorConstruction1) exterior.push(`Construction: ${property.details.exteriorConstruction1}`)
    if (property.details.driveway) exterior.push(`Driveway: ${property.details.driveway}`)
    if (property.details.garage) exterior.push(`Garage: ${property.details.garage}`)
    if (property.details.patio) exterior.push(`Patio: ${property.details.patio}`)
    if (property.details.swimmingPool) exterior.push(`Pool: ${property.details.swimmingPool}`)
    if (exterior.length > 0) features['Exterior'] = exterior

    const parking: string[] = []
    if (property.details.numGarageSpaces) parking.push(`Garage Spaces: ${property.details.numGarageSpaces}`)
    if (property.details.numParkingSpaces) parking.push(`Parking Spaces: ${property.details.numParkingSpaces}`)
    if (parking.length > 0) features['Parking'] = parking

    const utilities: string[] = []
    if (property.details.waterSource) utilities.push(`Water: ${property.details.waterSource}`)
    if (property.details.sewer) utilities.push(`Sewer: ${property.details.sewer}`)
    if (utilities.length > 0) features['Utilities'] = utilities

    if (property.details.extras) {
      features['Additional Features'] = property.details.extras.split(',').map(s => s.trim())
    }
  }

  // Property address
  const address = {
    street: `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}`.trim(),
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
  const taxes = property.taxes?.annualAmount ?? 0
  const hoa = property.condominium?.fees?.maintenance
    ? parseFloat(property.condominium.fees.maintenance)
    : property.condominium?.maintenance
      ? parseFloat(String(property.condominium.maintenance))
      : 0

  const hasComparables = property.comparables && property.comparables.length > 0

  return (
    <Box sx={{ width: '100%' }}>
      {/* Sticky Tab Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 70,
          zIndex: 10,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabClick}
          aria-label="property details tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minWidth: { xs: 100, sm: 120 },
              px: { xs: 2, sm: 3 },
            },
            '& .Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
            },
          }}
        >
          {SECTIONS.map((section) => (
            <Tab key={section.id} label={section.label} />
          ))}
        </Tabs>
      </Box>

      {/* All sections stacked vertically */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
        {/* ── Overview ── */}
        <Box id="overview" ref={setSectionRef('overview')}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <PropertyNarrative property={property} />

            {property.details?.description && (
              <PropertyDescription description={property.details.description} address={propertyAddress} />
            )}

            <PropertyKeyFacts
              mlsNumber={property.mlsNumber || ''}
              propertyType={property.details?.propertyType}
              status={property.status}
              yearBuilt={property.details?.yearBuilt ? parseInt(property.details.yearBuilt) : undefined}
              lotSize={property.lot?.acres ?? undefined}
              pricePerSqft={pricePerSqft}
              hoa={hoa}
              annualTaxes={taxes}
              daysOnMarket={property.daysOnMarket ? parseInt(property.daysOnMarket) : undefined}
              address={propertyAddress}
            />

            <PropertyValueEstimate
              estimate={property.estimate}
              listPrice={parseFloat(property.listPrice)}
              mlsNumber={property.mlsNumber}
              boardId={property.boardId}
            />

            <EstimateHistoryTable
              history={property.estimate?.history}
              currentEstimate={property.estimate?.value}
            />

            <CompareToMyHome
              listPrice={price}
              beds={property.details?.numBedrooms ? parseInt(property.details.numBedrooms) : 0}
              baths={property.details?.numBathrooms ? parseInt(property.details.numBathrooms) : 0}
              sqft={sqft}
              propertyType={property.details?.propertyType}
            />

            <SoldPriceDistribution
              city={address.city}
              neighborhood={property.address?.neighborhood}
              propertyType={property.details?.propertyType}
            />

            {Object.keys(features).length > 0 && (
              <PropertyFeatures features={features} />
            )}

            <PropertyHistory
              history={property.history}
              currentPrice={price}
              originalPrice={property.originalPrice
                ? (typeof property.originalPrice === 'number' ? property.originalPrice : parseFloat(property.originalPrice as string))
                : price}
              listDate={property.listDate}
              sqft={sqft}
              address={propertyAddress}
            />

            <PropertyTaxHistory taxes={property.taxes} />

            <PropertyPublicRecords property={property} />

            {hasComparables && (
              <PropertyComparables
                comparables={property.comparables || []}
                currentProperty={property}
              />
            )}
          </Box>
        </Box>

        {/* ── Location ── */}
        <Box id="location" ref={setSectionRef('location')}>
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
          <NearbyPlaces
            lat={property.map?.latitude || 0}
            lng={property.map?.longitude || 0}
            address={propertyAddress}
          />
          <WalkScore
            lat={property.map?.latitude || 0}
            lng={property.map?.longitude || 0}
            address={propertyAddress}
          />
          <CommuteCalculator
            originAddress={propertyAddress}
            originLat={property.map?.latitude || 0}
            originLng={property.map?.longitude || 0}
          />
          <PropertyNeighborhood
            neighborhood={property.address?.neighborhood}
            city={property.address?.city}
            state={property.address?.state}
            zip={property.address?.zip}
          />
          {marketStats && (
            <PropertyMarketStats
              neighborhood={property.address?.neighborhood}
              city={property.address?.city}
              state={property.address?.state}
              stats={marketStats}
            />
          )}
        </Box>

        {/* ── Mortgage ── */}
        <Box id="mortgage" ref={setSectionRef('mortgage')}>
          <PropertyMortgageCalculator
            price={price}
            defaultInterestRate={defaultInterestRate}
            propertyTaxes={taxes}
            hoaMonthly={hoa}
          />
          <CashFlowCalculator
            listPrice={price}
            propertyTaxAnnual={taxes}
            hoaMonthly={hoa}
          />
        </Box>

        {/* ── Similar Homes ── */}
        <Box id="similar" ref={setSectionRef('similar')}>
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

            <RelatedPages
              city={property.address?.city}
              state={property.address?.state}
              neighborhood={property.address?.neighborhood}
              propertyType={property.details?.propertyType}
              zipCode={property.address?.zip}
              schoolDistrict={undefined}
            />
            <RelatedBlogs
              posts={[]}
              city={property.address?.city}
              state={property.address?.state}
              propertyType={property.details?.propertyType}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default PropertyTabs
