declare global {
  interface Window {
    ssPixel?: (action: string, data?: Record<string, any>) => void
  }
}

export function ssIdentify(data: { email?: string; name?: string; phone?: string }) {
  window.ssPixel?.('identify', data)
}

export function ssTrackPropertyView(property: {
  mlsNumber: string
  street: string
  city: string
  state: string
  zipcode: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  propertyType: string
  url: string
}) {
  window.ssPixel?.('property_view', property)
}

export function ssTrackSavedProperty(data: {
  mls_number: string
  address: string
  price: number
}) {
  window.ssPixel?.('saved_property', data)
}

export function ssTrackEvent(eventType: string, eventData: Record<string, any>) {
  window.ssPixel?.('event', { event_type: eventType, event_data: eventData })
}
