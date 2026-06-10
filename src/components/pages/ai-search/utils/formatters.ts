import type { AiSearchListing } from '../types'

export const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)

export const formatMapPrice = (price: number, type?: string): string => {
  const isLease = type === 'Lease'
  if (isLease) {
    if (price >= 1000) {
      const k = price / 1000
      return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}K`
    }
    return Math.round(price).toString()
  }
  if (price >= 999500) {
    const m = price / 1_000_000
    return `${m >= 10 ? Math.round(m * 10) / 10 : Math.round(m * 100) / 100}M`
  }
  if (price >= 1000) {
    const k = price / 1000
    return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}K`
  }
  return Math.round(price).toString()
}

export const formatBedrooms = (details: AiSearchListing['details']): string => {
  if (!details) return '—'
  const total = details.numBedrooms
  const plus = details.numBedroomsPlus
  if (total && plus && plus > 0) return `${total} + ${plus}`
  return total?.toString() || '—'
}

export const formatBathrooms = (
  details: AiSearchListing['details']
): string => {
  if (!details) return '—'
  const total = details.numBathrooms
  const plus = details.numBathroomsPlus
  if (total && plus && plus > 0) return `${total} + ${plus}`
  return total?.toString() || '—'
}

export const formatAddress = (address: AiSearchListing['address']): string => {
  if (!address) return 'Address not available'
  const street = [
    address.streetNumber,
    address.streetDirection,
    address.streetName,
    address.streetSuffix
  ]
    .filter(Boolean)
    .join(' ')
  const cityState = [address.city, address.state].filter(Boolean).join(', ')
  return [street, cityState].filter(Boolean).join(', ')
}
