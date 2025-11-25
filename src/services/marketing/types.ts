/**
 * Marketing and Advertising Types
 * Types for Google Ads, Facebook Ads, and remarketing integrations
 */

// Enhanced Conversions user data
export interface EnhancedConversionData {
  email?: string
  phone_number?: string
  first_name?: string
  last_name?: string
  street?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
}

// Property data for remarketing
export interface RemarketingPropertyData {
  id: string
  listing_id: string
  name: string
  address: string
  city: string
  region: string
  country: string
  postal_code: string
  price: number
  currency: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  image_url: string
  url: string
  availability: 'for sale' | 'for rent' | 'sold' | 'pending'
  latitude?: number
  longitude?: number
}

// Google Ads Real Estate Feed Item
export interface GoogleRealEstateFeedItem {
  'Property ID': string
  'Property name': string
  'Final URL': string
  'Image URL': string
  'Destination name': string
  Price: string
  'Sale price': string
  'Formatted price': string
  'Formatted sale price': string
  'Property type': string
  'Listing type': string
  Address: string
  'Contextual keywords': string
}

// Google Page Feed Item for Dynamic Search Ads
export interface GooglePageFeedItem {
  'Page URL': string
  'Custom label': string
}

// Facebook Catalog Product Item
export interface FacebookCatalogItem {
  id: string
  title: string
  description: string
  availability: 'in stock' | 'out of stock'
  condition: 'new'
  price: string
  link: string
  image_link: string
  brand: string
  google_product_category: string
  address: {
    addr1: string
    city: string
    region: string
    postal_code: string
    country: string
  }
  property_type: string
  num_beds: number
  num_baths: number
  area_size: {
    value: number
    unit: 'sq_ft' | 'sq_m'
  }
  year_built?: number
  latitude?: number
  longitude?: number
}

// Ad Customizer Feed Item
export interface AdCustomizerFeedItem {
  'Target campaign': string
  'Target ad group': string
  'Custom ID': string
  'City (text)': string
  'Property count (number)': number
  'Min price (price)': string
  'Max price (price)': string
  'Property type (text)': string
  'Last updated (date)': string
}

// Data Layer Event Types
export interface DataLayerEvent {
  event: string
  [key: string]: unknown
}

// Property View Event
export interface PropertyViewEvent extends DataLayerEvent {
  event: 'view_item'
  ecommerce: {
    currency: string
    value: number
    items: Array<{
      item_id: string
      item_name: string
      item_category: string
      item_category2: string
      item_category3: string
      price: number
      quantity: 1
    }>
  }
  property: RemarketingPropertyData
}

// Lead Event
export interface LeadEvent extends DataLayerEvent {
  event: 'generate_lead'
  currency: string
  value: number
  user_data?: EnhancedConversionData
}

// Search Event
export interface SearchEvent extends DataLayerEvent {
  event: 'view_search_results'
  search_term: string
  search_filters: {
    city?: string
    property_type?: string
    min_price?: number
    max_price?: number
    bedrooms?: number
    bathrooms?: number
  }
  results_count: number
}

// Conversion Event with Enhanced Conversions
export interface ConversionEvent extends DataLayerEvent {
  event: 'conversion'
  send_to: string
  value?: number
  currency?: string
  transaction_id?: string
  user_data?: EnhancedConversionData
}

// Feed Generation Options
export interface FeedGenerationOptions {
  format: 'csv' | 'xml' | 'json'
  limit?: number
  offset?: number
  filters?: {
    city?: string
    property_type?: string
    min_price?: number
    max_price?: number
    status?: string
  }
}
