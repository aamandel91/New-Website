import { pushToDataLayer } from 'services/marketing/dataLayer'

interface FormData {
  name: string
  email: string
  phone: string
  message?: string
}

interface PropertyData {
  mlsNumber: string
  listPrice: string
  address?: {
    streetNumber?: string
    streetName?: string
    streetSuffix?: string
    city?: string
    state?: string
    zip?: string
  }
  details?: {
    propertyType?: string
  }
}

export function trackFormSubmission(
  formData: FormData,
  formType: 'tour_request' | 'contact' | 'offer'
) {
  const nameParts = formData.name?.trim().split(' ') || []
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  pushToDataLayer({
    event: 'form_submission',
    form_type: formType,
    enhanced_conversions: {
      email: formData.email,
      phone_number: formData.phone,
      first_name: firstName,
      last_name: lastName,
    },
  })
}

export function trackPropertyView(property: PropertyData) {
  const addr = property.address
  const address = addr
    ? `${addr.streetNumber || ''} ${addr.streetName || ''} ${addr.streetSuffix || ''}`.trim()
    : ''

  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      items: [
        {
          item_id: property.mlsNumber,
          item_name: address,
          price: parseFloat(property.listPrice),
          item_category: property.details?.propertyType,
          item_category2: property.address?.city,
        },
      ],
    },
  })
}

export function trackSearch(searchParams: Record<string, unknown>) {
  pushToDataLayer({
    event: 'search',
    search_params: searchParams,
  })
}
