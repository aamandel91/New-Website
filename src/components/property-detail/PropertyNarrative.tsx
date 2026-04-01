'use client'

import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import Link from 'next/link'
import type { Property } from 'services/API/types'

interface PropertyNarrativeProps {
  property: Property
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const PropertyNarrative: React.FC<PropertyNarrativeProps> = ({ property }) => {
  const { details, address } = property

  const beds = details?.numBedrooms ? parseInt(details.numBedrooms) : 0
  const baths = details?.numBathrooms ? parseInt(details.numBathrooms) : 0
  const sqft = details?.sqft ? parseInt(details.sqft) : 0
  const yearBuilt = details?.yearBuilt || ''
  const propertyType = details?.propertyType || 'property'
  const price = property.listPrice ? parseFloat(property.listPrice) : 0

  const city = address?.city || ''
  const state = address?.state || ''
  const neighborhood = address?.neighborhood || ''

  // Build narrative parts
  const parts: React.ReactNode[] = []

  // Opening with type, beds, baths
  let opening = 'This'
  if (beds > 0 && baths > 0) {
    opening += ` ${beds}-bedroom, ${baths}-bathroom ${propertyType.toLowerCase()}`
  } else {
    opening += ` ${propertyType.toLowerCase()}`
  }

  if (city) {
    opening += ' in '
    parts.push(
      <React.Fragment key="opening">
        {opening}
        <Link
          href={`/${slugify(city)}`}
          style={{ color: '#1976d2', textDecoration: 'none' }}
        >
          {city}
        </Link>
      </React.Fragment>
    )
  } else {
    parts.push(<React.Fragment key="opening">{opening}</React.Fragment>)
  }

  // Sqft
  if (sqft > 0) {
    parts.push(
      <React.Fragment key="sqft">
        {' '}offers {sqft.toLocaleString()} sq ft of living space.
      </React.Fragment>
    )
  } else {
    parts.push(<React.Fragment key="sqft-period">. </React.Fragment>)
  }

  // Year built + neighborhood
  const builtParts: React.ReactNode[] = []
  if (yearBuilt) {
    builtParts.push(`Built in ${yearBuilt}`)
  }
  if (neighborhood) {
    builtParts.push(
      <React.Fragment key="neighborhood">
        {yearBuilt ? ' and located in the ' : 'Located in the '}
        <Link
          href={`/${slugify(city)}/${slugify(neighborhood)}`}
          style={{ color: '#1976d2', textDecoration: 'none' }}
        >
          {neighborhood}
        </Link>
        {' neighborhood'}
      </React.Fragment>
    )
  }
  if (builtParts.length > 0) {
    parts.push(
      <React.Fragment key="built">
        {' '}{builtParts}
      </React.Fragment>
    )
  }

  // Key features
  const featureList: string[] = []
  if (details?.swimmingPool && details.swimmingPool !== 'None') {
    featureList.push(details.swimmingPool.toLowerCase().includes('pool') ? details.swimmingPool.toLowerCase() : `${details.swimmingPool.toLowerCase()} pool`)
  }
  if (details?.numGarageSpaces && parseInt(details.numGarageSpaces) > 0) {
    featureList.push(`${details.numGarageSpaces}-car garage`)
  }
  if (details?.basement1 && details.basement1 !== 'None') {
    featureList.push(`${details.basement1.toLowerCase()} basement`)
  }
  if (details?.numFireplaces && parseInt(details.numFireplaces) > 0) {
    featureList.push(`${details.numFireplaces} fireplace${parseInt(details.numFireplaces) > 1 ? 's' : ''}`)
  }

  if (featureList.length > 0) {
    const featureStr =
      featureList.length === 1
        ? featureList[0]
        : featureList.length === 2
          ? `${featureList[0]} and ${featureList[1]}`
          : `${featureList.slice(0, -1).join(', ')}, and ${featureList[featureList.length - 1]}`
    parts.push(
      <React.Fragment key="features">
        , this property features {featureStr}.
      </React.Fragment>
    )
  } else if (builtParts.length > 0) {
    parts.push(<React.Fragment key="period1">. </React.Fragment>)
  }

  // Price
  if (price > 0) {
    const pricePerSqft = sqft > 0 ? Math.round(price / sqft) : 0
    parts.push(
      <React.Fragment key="price">
        {' '}Listed at {formatCurrency(price)}
        {pricePerSqft > 0 ? ` ($${pricePerSqft}/sq ft)` : ''}
        , this home is competitively priced for the area.
      </React.Fragment>
    )
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3 }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        About This Property
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
        {parts}
      </Typography>
    </Paper>
  )
}

export default PropertyNarrative
