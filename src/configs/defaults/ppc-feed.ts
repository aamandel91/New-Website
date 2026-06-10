/**
 * PPC Page Feed configuration for Google Dynamic Search Ads.
 * Controls which area/sub-type pages qualify for paid search campaigns.
 */

import { activeMarkets } from '@configs/page-generation'

export interface PriceTier {
  label: string
  min: number
  max: number
}

export interface PPCFeedConfig {
  minAvgPrice: number
  minListings: number
  includeSubTypes: boolean
  includeNeighborhoods: boolean
  includeCities: boolean
  excludeSubTypes: string[]
  targetAreas: string[]
  priceTiers: PriceTier[]
  baseUrl: string
}

export const ppcFeedConfig: PPCFeedConfig = {
  minAvgPrice: 750000,
  minListings: 5,
  includeSubTypes: true,
  includeNeighborhoods: true,
  includeCities: false,
  excludeSubTypes: [
    'foreclosures',
    'va-approved',
    'fha-approved',
    'rentals',
    'land',
    'one-acre-plus'
  ],
  targetAreas: activeMarkets.flatMap((m) => m.counties),
  priceTiers: [
    { label: '$750K-$1M', min: 750000, max: 1000000 },
    { label: '$1M-$1.5M', min: 1000000, max: 1500000 },
    { label: '$1.5M-$2M', min: 1500000, max: 2000000 },
    { label: '$2M+', min: 2000000, max: Infinity }
  ],
  baseUrl: 'https://floridahomefinder.com'
}
