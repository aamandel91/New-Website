/**
 * Traffic Source Tracking Utility
 * Handles capturing and storing UTM parameters and traffic source information
 */

export interface TrafficSourceData {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  referer?: string
  landingPage?: string
  trafficType?:
    | 'ppc'
    | 'organic'
    | 'direct'
    | 'referral'
    | 'social'
    | 'email'
    | 'other'
}

const TRAFFIC_SOURCE_KEY = 'traffic_source_data'
const PROPERTY_VIEW_COUNT_KEY = 'property_view_count'

/**
 * Extracts UTM parameters from URL search params
 */
export function extractUtmParams(
  searchParams: URLSearchParams
): TrafficSourceData {
  return {
    utmSource: searchParams.get('utm_source') || undefined,
    utmMedium: searchParams.get('utm_medium') || undefined,
    utmCampaign: searchParams.get('utm_campaign') || undefined,
    utmTerm: searchParams.get('utm_term') || undefined,
    utmContent: searchParams.get('utm_content') || undefined
  }
}

/**
 * Determines traffic type based on UTM parameters
 */
export function determineTrafficType(
  data: TrafficSourceData
): TrafficSourceData['trafficType'] {
  const { utmSource, utmMedium } = data

  if (!utmSource && !utmMedium) {
    return 'direct'
  }

  const source = (utmSource || '').toLowerCase()
  const medium = (utmMedium || '').toLowerCase()

  // Check for paid traffic indicators
  const paidMediums = ['cpc', 'ppc', 'paid', 'paidsearch', 'cpm', 'banner']
  const paidSources = [
    'google',
    'bing',
    'facebook',
    'linkedin',
    'twitter',
    'instagram'
  ]

  if (paidMediums.includes(medium)) {
    return 'ppc'
  }

  // If source is a known ad platform and medium suggests paid
  if (paidSources.includes(source) && medium.includes('ad')) {
    return 'ppc'
  }

  // Organic traffic
  if (medium === 'organic' || source === 'google' || source === 'bing') {
    return 'organic'
  }

  // Referral traffic
  if (medium === 'referral') {
    return 'referral'
  }

  // Social traffic
  if (
    ['social', 'facebook', 'twitter', 'linkedin', 'instagram'].includes(source)
  ) {
    return 'social'
  }

  // Email traffic
  if (medium === 'email') {
    return 'email'
  }

  return 'other'
}

/**
 * Stores traffic source data in sessionStorage
 * Only stores on first visit (won't overwrite existing data)
 */
export function storeTrafficSource(data: TrafficSourceData): void {
  if (typeof window === 'undefined') return

  try {
    // Only store if not already stored (first visit)
    const existing = sessionStorage.getItem(TRAFFIC_SOURCE_KEY)
    if (existing) {
      return // Don't overwrite existing traffic source
    }

    const trafficType = determineTrafficType(data)
    const fullData: TrafficSourceData = {
      ...data,
      trafficType,
      referer: document.referrer || undefined,
      landingPage: window.location.href
    }

    sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify(fullData))
  } catch (error) {
    console.error('Failed to store traffic source:', error)
  }
}

/**
 * Retrieves stored traffic source data
 */
export function getTrafficSource(): TrafficSourceData | null {
  if (typeof window === 'undefined') return null

  try {
    const data = sessionStorage.getItem(TRAFFIC_SOURCE_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to retrieve traffic source:', error)
    return null
  }
}

/**
 * Clears stored traffic source data
 */
export function clearTrafficSource(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(TRAFFIC_SOURCE_KEY)
  } catch (error) {
    console.error('Failed to clear traffic source:', error)
  }
}

/**
 * Checks if current traffic is from PPC sources
 */
export function isPpcTraffic(): boolean {
  const trafficSource = getTrafficSource()
  return trafficSource?.trafficType === 'ppc'
}

/**
 * Checks if current traffic is organic
 */
export function isOrganicTraffic(): boolean {
  const trafficSource = getTrafficSource()
  return trafficSource?.trafficType === 'organic'
}

/**
 * Increments and returns property view count
 */
export function incrementPropertyViewCount(): number {
  if (typeof window === 'undefined') return 0

  try {
    const current = parseInt(
      sessionStorage.getItem(PROPERTY_VIEW_COUNT_KEY) || '0',
      10
    )
    const newCount = current + 1
    sessionStorage.setItem(PROPERTY_VIEW_COUNT_KEY, newCount.toString())
    return newCount
  } catch (error) {
    console.error('Failed to increment property view count:', error)
    return 0
  }
}

/**
 * Gets current property view count
 */
export function getPropertyViewCount(): number {
  if (typeof window === 'undefined') return 0

  try {
    return parseInt(sessionStorage.getItem(PROPERTY_VIEW_COUNT_KEY) || '0', 10)
  } catch (error) {
    console.error('Failed to get property view count:', error)
    return 0
  }
}

/**
 * Resets property view count
 */
export function resetPropertyViewCount(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(PROPERTY_VIEW_COUNT_KEY)
  } catch (error) {
    console.error('Failed to reset property view count:', error)
  }
}

/**
 * Initializes traffic source tracking from current URL
 * Should be called on app initialization
 */
export function initializeTrafficTracking(): void {
  if (typeof window === 'undefined') return

  try {
    const searchParams = new URLSearchParams(window.location.search)
    const utmParams = extractUtmParams(searchParams)

    // Only store if we have at least one UTM parameter
    if (Object.values(utmParams).some((val) => val !== undefined)) {
      storeTrafficSource(utmParams)
    } else {
      // If no UTM params but no existing traffic source, store as direct
      const existing = getTrafficSource()
      if (!existing) {
        storeTrafficSource({})
      }
    }
  } catch (error) {
    console.error('Failed to initialize traffic tracking:', error)
  }
}
