import React from 'react'
import dynamic from 'next/dynamic'

import { Box, Skeleton, Typography } from '@mui/material'

import { tenant } from '@/configs/tenant.config'
import {
  educationalOrganizationSchema,
  placeSchema
} from '@/utils/structuredData'
import StructuredData from '@shared/StructuredData'

import {
  type AreaDemographics,
  type AreaMarketStats,
  type AreaSchool,
  fetchAreaDemographics,
  fetchAreaMarketStats,
  fetchAreaSchools
} from './areaDataFetch'

// Lazy-loaded client components so they don't block the initial PDP render.
const NeighborhoodDemographics = dynamic(
  () => import('./NeighborhoodDemographics'),
  {
    loading: () => (
      <Skeleton
        variant="rectangular"
        height={180}
        sx={{ mb: 3, borderRadius: 1 }}
      />
    )
  }
)

const LocalSchools = dynamic(() => import('./LocalSchools'), {
  loading: () => (
    <Skeleton
      variant="rectangular"
      height={240}
      sx={{ mb: 3, borderRadius: 1 }}
    />
  )
})

const MarketStatistics = dynamic(() => import('./MarketStatistics'), {
  loading: () => (
    <Skeleton
      variant="rectangular"
      height={320}
      sx={{ mb: 3, borderRadius: 1 }}
    />
  )
})

interface AboutTheAreaProps {
  cityName?: string
  coordinates?: { lat: number; lng: number }
  variant?: 'pdp' | 'city'
  id?: string
}

/**
 * Server component that fetches area data upfront so it lands in the SSR HTML
 * (good for SEO) and hands pre-fetched results to the lazy client components.
 * If none of the data sources return anything, the entire block is hidden.
 */
const AboutTheArea = async ({
  cityName,
  coordinates,
  variant = 'pdp',
  id = 'about-the-area'
}: AboutTheAreaProps) => {
  const hasCoords = Boolean(coordinates?.lat && coordinates?.lng)
  const [demographics, schools, marketStats] = await Promise.all([
    hasCoords
      ? fetchAreaDemographics(coordinates!.lat, coordinates!.lng)
      : Promise.resolve<AreaDemographics | null>(null),
    hasCoords
      ? fetchAreaSchools(coordinates!.lat, coordinates!.lng)
      : Promise.resolve<AreaSchool[] | null>(null),
    cityName
      ? fetchAreaMarketStats(cityName)
      : Promise.resolve<AreaMarketStats | null>(null)
  ])

  const hasAny =
    Boolean(demographics) ||
    Boolean(schools && schools.length > 0) ||
    Boolean(marketStats)
  if (!hasAny) return null

  const heading =
    variant === 'city'
      ? `Living in ${cityName ?? 'this area'}`
      : 'About the Area'

  // Build optional Schema.org payloads. Top 5 rated schools as
  // EducationalOrganization, plus a Place schema for city variant pages with
  // an AggregateRating averaged across those schools.
  const topRated = (schools ?? [])
    .filter((s) => s.rating !== undefined)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5)
  const aggregateRating =
    topRated.length > 0
      ? {
          ratingValue:
            topRated.reduce((sum, s) => sum + (s.rating ?? 0), 0) /
            topRated.length,
          reviewCount: topRated.length
        }
      : undefined

  return (
    <Box id={id} sx={{ scrollMarginTop: 88, mt: variant === 'city' ? 4 : 0 }}>
      {topRated.map((school, idx) => (
        <StructuredData
          key={`school-ld-${idx}`}
          data={educationalOrganizationSchema({
            name: school.name,
            cityName,
            level: school.level,
            rating: school.rating
          })}
        />
      ))}
      {variant === 'city' && cityName && (
        <StructuredData
          data={placeSchema({
            cityName,
            state: 'FL',
            lat: coordinates?.lat,
            lng: coordinates?.lng,
            url: `${tenant.brand.siteUrl}/${cityName
              .toLowerCase()
              .replace(/\s+/g, '-')}`,
            aggregateRating
          })}
        />
      )}
      <Typography variant="h4" component="h2" fontWeight={700} sx={{ mb: 2 }}>
        {heading}
      </Typography>
      {demographics && (
        <NeighborhoodDemographics
          cityName={cityName}
          coordinates={coordinates}
          initialData={demographics}
        />
      )}
      {schools && schools.length > 0 && (
        <LocalSchools coordinates={coordinates} initialData={schools} />
      )}
      {marketStats && (
        <MarketStatistics cityName={cityName} initialData={marketStats} />
      )}
    </Box>
  )
}

export default AboutTheArea
