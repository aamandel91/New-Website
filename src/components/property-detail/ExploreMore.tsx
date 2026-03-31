'use client'

import React from 'react'
import { Box, Typography, Link as MuiLink, Stack, Paper } from '@mui/material'
import Link from 'next/link'
import type { Property } from 'services/API'
import { displayNameToSlug } from 'utils/templateEngine'

interface ExploreMoreProps {
  property: Property
  similarProperties?: Property[]
}

function getPropertyTypeSlug(propertyType?: string): string | null {
  if (!propertyType) return null
  const lower = propertyType.toLowerCase()
  if (lower.includes('apartment') || lower.includes('condo')) return 'condos'
  if (lower.includes('detached') || lower.includes('single')) return 'single-family-homes'
  if (lower.includes('townhouse') || lower.includes('att/row')) return 'townhomes'
  if (lower.includes('multi')) return 'multi-family'
  if (lower.includes('land')) return 'land'
  return null
}

function getPropertyTypeLabel(propertyType?: string): string | null {
  if (!propertyType) return null
  const lower = propertyType.toLowerCase()
  if (lower.includes('apartment') || lower.includes('condo')) return 'Condos'
  if (lower.includes('detached') || lower.includes('single')) return 'Single Family Homes'
  if (lower.includes('townhouse') || lower.includes('att/row')) return 'Townhomes'
  if (lower.includes('multi')) return 'Multi-Family Homes'
  if (lower.includes('land')) return 'Lots & Land'
  return null
}

function getNextPriceTier(price: number): number | null {
  if (price <= 0) return null
  const tiers = [200000, 300000, 400000, 500000, 600000, 750000, 1000000, 1500000, 2000000]
  return tiers.find((t) => t > price) ?? null
}

function formatCompactPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  return `${Math.round(price / 1000)}K`
}

function MiniPropertyCard({ property }: { property: Property }) {
  const address = property.address
  const street = `${address?.streetNumber || ''} ${address?.streetName || ''} ${address?.streetSuffix || ''}`.trim()
  const price = property.listPrice ? parseFloat(property.listPrice) : 0
  const description = property.details?.description || ''
  const snippet = description.length > 120 ? `${description.slice(0, 120)}...` : description

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" noWrap>
        {street}
      </Typography>
      <Typography variant="body2" color="primary.main" fontWeight={600}>
        {price > 0
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
          : 'Price TBD'}
      </Typography>
      {snippet && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 0.5,
          }}
        >
          {snippet}
        </Typography>
      )}
    </Paper>
  )
}

const ExploreMore: React.FC<ExploreMoreProps> = ({ property, similarProperties = [] }) => {
  const city = property.address?.city
  const county = property.address?.district
  const neighborhood = property.address?.neighborhood
  const propertyType = property.details?.propertyType
  const price = property.listPrice ? parseFloat(property.listPrice) : 0

  if (!city) return null

  const citySlug = displayNameToSlug(city)
  const countySlug = county ? `${displayNameToSlug(county)}-county` : ''
  const typeSlug = getPropertyTypeSlug(propertyType)
  const typeLabel = getPropertyTypeLabel(propertyType)
  const nextTier = getNextPriceTier(price)

  const previewCards = similarProperties.slice(0, 3)

  return (
    <Box component="section" sx={{ py: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Explore More
      </Typography>

      <Stack spacing={3}>
        {/* Neighborhood suggestion */}
        {neighborhood && countySlug && (
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              More homes in {neighborhood}
            </Typography>
            <Link
              href={`/florida/${countySlug}/${citySlug}/neighborhoods/${displayNameToSlug(neighborhood)}`}
              passHref
              legacyBehavior
            >
              <MuiLink variant="body2" underline="hover" fontWeight="bold">
                Browse {neighborhood} listings →
              </MuiLink>
            </Link>
            {previewCards.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {previewCards
                  .filter((p) => p.address?.neighborhood === neighborhood)
                  .slice(0, 2)
                  .map((p) => (
                    <MiniPropertyCard key={p.mlsNumber} property={p} />
                  ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Property type in city */}
        {typeSlug && typeLabel && countySlug && (
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {typeLabel} in {city}
            </Typography>
            <Link
              href={`/florida/${countySlug}/${citySlug}/${typeSlug}`}
              passHref
              legacyBehavior
            >
              <MuiLink variant="body2" underline="hover" fontWeight="bold">
                Search {typeLabel.toLowerCase()} in {city} →
              </MuiLink>
            </Link>
            {previewCards.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {previewCards.slice(0, 2).map((p) => (
                  <MiniPropertyCard key={p.mlsNumber} property={p} />
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Price tier suggestion */}
        {nextTier && countySlug && (
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              Homes under ${formatCompactPrice(nextTier)} in {city}
            </Typography>
            <Link
              href={`/search/grid?city=${encodeURIComponent(city)}&maxPrice=${nextTier}`}
              passHref
              legacyBehavior
            >
              <MuiLink variant="body2" underline="hover" fontWeight="bold">
                See homes under ${formatCompactPrice(nextTier)} →
              </MuiLink>
            </Link>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

export default ExploreMore
