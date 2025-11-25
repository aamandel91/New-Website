/**
 * Data Layer Utilities for Marketing and Remarketing
 * Handles Google Ads Enhanced Conversions, Dynamic Remarketing, and Facebook tracking
 */

import type {
  ConversionEvent,
  DataLayerEvent,
  EnhancedConversionData,
  LeadEvent,
  PropertyViewEvent,
  RemarketingPropertyData,
  SearchEvent
} from './types'

declare global {
  interface Window {
    dataLayer: DataLayerEvent[]
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void
  }
}

const debugMode = process.env.NEXT_PUBLIC_DEBUG_TRACKING_EVENTS === 'true'

/**
 * Push event to data layer
 */
export const pushToDataLayer = (event: DataLayerEvent): void => {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)

  if (debugMode) {
    // eslint-disable-next-line no-console
    console.log(`%c[DataLayer]: ${event.event}`, 'color: #4CAF50', event)
  }
}

/**
 * Hash user data for enhanced conversions (SHA-256)
 */
export const hashUserData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Prepare enhanced conversion data with hashing
 */
export const prepareEnhancedConversionData = async (
  userData: EnhancedConversionData
): Promise<EnhancedConversionData> => {
  const hashedData: EnhancedConversionData = {}

  if (userData.email) {
    hashedData.email = await hashUserData(userData.email)
  }
  if (userData.phone_number) {
    // Remove all non-numeric characters and hash
    const cleanPhone = userData.phone_number.replace(/\D/g, '')
    hashedData.phone_number = await hashUserData(cleanPhone)
  }
  if (userData.first_name) {
    hashedData.first_name = await hashUserData(userData.first_name)
  }
  if (userData.last_name) {
    hashedData.last_name = await hashUserData(userData.last_name)
  }
  if (userData.street) {
    hashedData.street = await hashUserData(userData.street)
  }
  if (userData.city) {
    hashedData.city = await hashUserData(userData.city)
  }
  if (userData.region) {
    hashedData.region = await hashUserData(userData.region)
  }
  if (userData.postal_code) {
    hashedData.postal_code = await hashUserData(userData.postal_code)
  }
  if (userData.country) {
    hashedData.country = await hashUserData(userData.country)
  }

  return hashedData
}

/**
 * Track property view for dynamic remarketing
 */
export const trackPropertyView = (property: RemarketingPropertyData): void => {
  const event: PropertyViewEvent = {
    event: 'view_item',
    ecommerce: {
      currency: property.currency,
      value: property.price,
      items: [
        {
          item_id: property.listing_id,
          item_name: property.name,
          item_category: 'Real Estate',
          item_category2: property.property_type,
          item_category3: property.city,
          price: property.price,
          quantity: 1
        }
      ]
    },
    property
  }

  pushToDataLayer(event)

  // Also push to Facebook if available
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [property.listing_id],
      content_type: 'home_listing',
      content_name: property.name,
      value: property.price,
      currency: property.currency
    })
  }
}

/**
 * Track property listing impression
 */
export const trackPropertyImpression = (
  properties: RemarketingPropertyData[]
): void => {
  const event: DataLayerEvent = {
    event: 'view_item_list',
    ecommerce: {
      currency: properties[0]?.currency || 'USD',
      items: properties.map((property, index) => ({
        item_id: property.listing_id,
        item_name: property.name,
        item_category: 'Real Estate',
        item_category2: property.property_type,
        item_category3: property.city,
        price: property.price,
        quantity: 1,
        index
      }))
    }
  }

  pushToDataLayer(event)
}

/**
 * Track search results for remarketing
 */
export const trackSearchResults = (
  searchTerm: string,
  filters: SearchEvent['search_filters'],
  resultsCount: number
): void => {
  const event: SearchEvent = {
    event: 'view_search_results',
    search_term: searchTerm,
    search_filters: filters,
    results_count: resultsCount
  }

  pushToDataLayer(event)

  // Facebook Search event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Search', {
      search_string: searchTerm,
      content_category: 'Real Estate'
    })
  }
}

/**
 * Track lead generation with enhanced conversions
 */
export const trackLead = async (
  value: number,
  currency: string,
  userData?: EnhancedConversionData
): Promise<void> => {
  const event: LeadEvent = {
    event: 'generate_lead',
    currency,
    value
  }

  if (userData) {
    event.user_data = await prepareEnhancedConversionData(userData)
  }

  pushToDataLayer(event)

  // Facebook Lead event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      value,
      currency
    })
  }
}

/**
 * Track conversion with enhanced conversions data
 */
export const trackConversion = async (
  conversionLabel: string,
  value?: number,
  currency?: string,
  transactionId?: string,
  userData?: EnhancedConversionData
): Promise<void> => {
  const event: ConversionEvent = {
    event: 'conversion',
    send_to: conversionLabel,
    value,
    currency,
    transaction_id: transactionId
  }

  if (userData) {
    event.user_data = await prepareEnhancedConversionData(userData)
  }

  pushToDataLayer(event)
}

/**
 * Track contact form submission
 */
export const trackContactSubmit = async (
  propertyId: string | null,
  userData: EnhancedConversionData
): Promise<void> => {
  const event: DataLayerEvent = {
    event: 'contact_form_submit',
    property_id: propertyId,
    user_data: await prepareEnhancedConversionData(userData)
  }

  pushToDataLayer(event)

  // Facebook CompleteRegistration
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration')
  }
}

/**
 * Track schedule showing/tour request
 */
export const trackScheduleShowing = async (
  property: RemarketingPropertyData,
  userData: EnhancedConversionData
): Promise<void> => {
  const event: DataLayerEvent = {
    event: 'schedule_showing',
    property,
    user_data: await prepareEnhancedConversionData(userData)
  }

  pushToDataLayer(event)

  // Facebook Schedule event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Schedule', {
      content_ids: [property.listing_id],
      content_type: 'home_listing'
    })
  }
}

/**
 * Track property added to favorites
 */
export const trackAddToFavorites = (
  property: RemarketingPropertyData
): void => {
  const event: DataLayerEvent = {
    event: 'add_to_wishlist',
    ecommerce: {
      currency: property.currency,
      value: property.price,
      items: [
        {
          item_id: property.listing_id,
          item_name: property.name,
          item_category: 'Real Estate',
          price: property.price,
          quantity: 1
        }
      ]
    }
  }

  pushToDataLayer(event)

  // Facebook AddToWishlist
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToWishlist', {
      content_ids: [property.listing_id],
      content_type: 'home_listing',
      value: property.price,
      currency: property.currency
    })
  }
}

/**
 * Set user data for enhanced conversions (persistent)
 */
export const setUserData = async (
  userData: EnhancedConversionData
): Promise<void> => {
  const hashedData = await prepareEnhancedConversionData(userData)

  pushToDataLayer({
    event: 'set_user_data',
    user_data: hashedData
  })
}

/**
 * Initialize remarketing with page type
 */
export const initPageRemarketing = (
  pageType: 'home' | 'search' | 'listing' | 'category' | 'other',
  additionalData?: Record<string, unknown>
): void => {
  pushToDataLayer({
    event: 'page_data',
    page_type: pageType,
    ...additionalData
  })
}
