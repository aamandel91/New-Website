// Uses normalized property fields (price, beds, baths, etc.) from the data mapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Property = any

export interface PropertyBadge {
  label: string
  color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
  priority: number // Higher priority badges show first
}

/**
 * Calculate days since a date
 */
function daysSince(dateString: string | undefined): number | null {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if price has been reduced
 */
function isPriceReduced(property: Property): boolean {
  const { price } = property
  if (!price) return false

  const currentPrice = price.current || price.list || 0
  const originalPrice = price.original || price.list || 0

  return originalPrice > 0 && currentPrice < originalPrice
}

/**
 * Calculate price reduction amount
 */
function getPriceReduction(property: Property): number {
  const { price } = property
  if (!price) return 0

  const currentPrice = price.current || price.list || 0
  const originalPrice = price.original || price.list || 0

  return originalPrice - currentPrice
}

/**
 * Check if property is a hot listing (low days on market relative to average)
 * This is a simplified check - in production you'd compare to market averages
 */
function isHotProperty(property: Property): boolean {
  const days = daysSince(property.listingDate)
  if (days === null) return false

  // Consider "hot" if listed recently and still active
  // Typical hot property: less than 14 days on market
  return days < 14 && property.status?.toLowerCase() === 'active'
}

/**
 * Check if property is newly listed
 */
function isNewListing(property: Property): boolean {
  const days = daysSince(property.listingDate)
  if (days === null) return false

  // New listing if less than 7 days old
  return days <= 7
}

/**
 * Check if property has an open house scheduled
 */
function hasOpenHouse(property: Property): boolean {
  // This would check if there's an upcoming open house
  // For now, return false - would need open house data from API
  return false
}

/**
 * Check if property is pending (offer accepted but not closed)
 */
function isPending(property: Property): boolean {
  const status = property.status?.toLowerCase()
  return status === 'pending' || status === 'p' || status === 'under contract'
}

/**
 * Check if property is sold
 */
function isSold(property: Property): boolean {
  const status = property.status?.toLowerCase()
  return status === 'sold' || status === 's' || status === 'closed'
}

/**
 * Check if property is a foreclosure
 */
function isForeclosure(property: Property): boolean {
  const features = property.features || []
  const remarks = property.description?.toLowerCase() || ''

  // Check features or remarks for foreclosure indicators
  const foreclosureKeywords = ['foreclosure', 'bank owned', 'reo', 'short sale']
  return foreclosureKeywords.some((keyword) => remarks.includes(keyword))
}

/**
 * Check if price is reduced AND it's significant (>= 5%)
 */
function isSignificantPriceReduction(property: Property): boolean {
  if (!isPriceReduced(property)) return false

  const { price } = property
  if (!price) return false

  const currentPrice = price.current || price.list || 0
  const originalPrice = price.original || price.list || 0
  const reductionPercent = ((originalPrice - currentPrice) / originalPrice) * 100

  return reductionPercent >= 5
}

/**
 * Generate all applicable badges for a property
 * Returns badges sorted by priority (highest first)
 */
export function getPropertyBadges(property: Property): PropertyBadge[] {
  const badges: PropertyBadge[] = []

  // Status-based badges (highest priority)
  if (isSold(property)) {
    badges.push({
      label: 'Sold',
      color: 'secondary',
      priority: 100,
    })
  } else if (isPending(property)) {
    badges.push({
      label: 'Pending',
      color: 'warning',
      priority: 95,
    })
  }

  // Price reduction badge (high priority)
  if (isSignificantPriceReduction(property)) {
    const reduction = getPriceReduction(property)
    const reductionLabel =
      reduction >= 10000
        ? `Price Reduced $${Math.floor(reduction / 1000)}K`
        : 'Price Reduced'

    badges.push({
      label: reductionLabel,
      color: 'success',
      priority: 90,
    })
  }

  // Hot property badge
  if (isHotProperty(property) && !isSold(property) && !isPending(property)) {
    badges.push({
      label: 'Hot Property',
      color: 'error',
      priority: 85,
    })
  }

  // New listing badge
  if (isNewListing(property) && !isSold(property)) {
    badges.push({
      label: 'New Listing',
      color: 'primary',
      priority: 80,
    })
  }

  // Open house badge
  if (hasOpenHouse(property) && !isSold(property) && !isPending(property)) {
    badges.push({
      label: 'Open House',
      color: 'info',
      priority: 75,
    })
  }

  // Foreclosure badge
  if (isForeclosure(property)) {
    badges.push({
      label: 'Foreclosure',
      color: 'warning',
      priority: 70,
    })
  }

  // Sort by priority (highest first) and limit to top 3
  return badges.sort((a, b) => b.priority - a.priority).slice(0, 3)
}

/**
 * Get the primary (highest priority) badge for a property
 */
export function getPrimaryBadge(property: Property): PropertyBadge | null {
  const badges = getPropertyBadges(property)
  return badges.length > 0 ? badges[0] : null
}

/**
 * Get formatted days on market string
 */
export function getDaysOnMarket(property: Property): string | null {
  const days = daysSince(property.listingDate)
  if (days === null) return null

  if (days === 0) return 'Listed today'
  if (days === 1) return '1 day on market'
  return `${days} days on market`
}
