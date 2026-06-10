declare global {
  interface Window {
    ssPixel?: (...args: any[]) => void
  }
}

/**
 * Identify a known user — call after login or form submission
 * Links all anonymous activity to the identified user
 */
export function ssIdentify(data: {
  email: string
  name?: string
  phone?: string
}) {
  window.ssPixel?.('identify', data)
}

/**
 * Track a property view with full listing data
 * Call on property detail pages
 */
export function ssTrackPropertyView(property: {
  mlsNumber: string
  street: string
  city: string
  state: string
  zipCode: string
  price: number
  propertyType: string
  bedrooms: string | number
  bathrooms: string | number
  squareFeet: string | number
  lotSize?: string | number
  forRent?: boolean
}) {
  window.ssPixel?.('track', 'property_view', property)
}

/**
 * Track a saved/favorited property
 */
export function ssTrackSavedProperty(data: {
  mlsNumber: string
  street: string
  city: string
  state: string
  zipCode: string
  price: number
}) {
  window.ssPixel?.('track', 'saved_property', data)
}

/**
 * Track a custom event
 */
export function ssTrackEvent(
  eventType: string,
  eventData: Record<string, any>
) {
  window.ssPixel?.('track', eventType, eventData)
}
