/**
 * Feed Generation Utilities
 * Generates feeds for Google Ads, Facebook Ads, and other advertising platforms
 */

import type {
  AdCustomizerFeedItem,
  FacebookCatalogItem,
  GooglePageFeedItem,
  GoogleRealEstateFeedItem,
  RemarketingPropertyData
} from './types'

// Helper functions

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

function generateContextualKeywords(property: RemarketingPropertyData): string {
  const keywords = [
    property.city,
    property.property_type,
    `${property.bedrooms} bedroom`,
    property.availability === 'for rent' ? 'rent' : 'sale',
    property.region
  ]
  return keywords.filter(Boolean).join(', ')
}

function getPriceRange(price: number): string {
  if (price < 200000) return 'under-200k'
  if (price < 300000) return '200k-300k'
  if (price < 400000) return '300k-400k'
  if (price < 500000) return '400k-500k'
  if (price < 750000) return '500k-750k'
  if (price < 1000000) return '750k-1m'
  return 'over-1m'
}

function generateCustomLabel(property: RemarketingPropertyData): string {
  const labels = [
    property.city,
    property.property_type,
    `${property.bedrooms}bd`,
    getPriceRange(property.price)
  ]
  return labels.filter(Boolean).join(';')
}

function generateDescription(property: RemarketingPropertyData): string {
  return `${property.bedrooms} bed, ${property.bathrooms} bath ${property.property_type} in ${property.city}, ${property.region}. ${property.square_feet.toLocaleString()} sq ft. ${formatPrice(property.price, property.currency)}.`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Convert property data to Google Real Estate feed format
 */
export const toGoogleRealEstateFeed = (
  properties: RemarketingPropertyData[],
  baseUrl: string
): GoogleRealEstateFeedItem[] => {
  return properties.map((property) => ({
    'Property ID': property.listing_id,
    'Property name': property.name,
    'Final URL': `${baseUrl}/listing/${property.listing_id}`,
    'Image URL': property.image_url,
    'Destination name': `${property.city}, ${property.region}`,
    Price: `${property.price} ${property.currency}`,
    'Sale price': '',
    'Formatted price': formatPrice(property.price, property.currency),
    'Formatted sale price': '',
    'Property type': property.property_type,
    'Listing type':
      property.availability === 'for rent' ? 'For Rent' : 'For Sale',
    Address: `${property.address}, ${property.city}, ${property.region} ${property.postal_code}`,
    'Contextual keywords': generateContextualKeywords(property)
  }))
}

/**
 * Convert property data to Google Page Feed format for Dynamic Search Ads
 */
export const toGooglePageFeed = (
  properties: RemarketingPropertyData[],
  baseUrl: string
): GooglePageFeedItem[] => {
  return properties.map((property) => ({
    'Page URL': `${baseUrl}/listing/${property.listing_id}`,
    'Custom label': generateCustomLabel(property)
  }))
}

/**
 * Convert property data to Facebook Catalog format
 */
export const toFacebookCatalog = (
  properties: RemarketingPropertyData[],
  baseUrl: string,
  brandName: string
): FacebookCatalogItem[] => {
  return properties.map((property) => ({
    id: property.listing_id,
    title: property.name,
    description: generateDescription(property),
    availability:
      property.availability === 'sold' || property.availability === 'pending'
        ? 'out of stock'
        : 'in stock',
    condition: 'new',
    price: `${property.price} ${property.currency}`,
    link: `${baseUrl}/listing/${property.listing_id}`,
    image_link: property.image_url,
    brand: brandName,
    google_product_category: '2271', // Property > Residential Properties
    address: {
      addr1: property.address,
      city: property.city,
      region: property.region,
      postal_code: property.postal_code,
      country: property.country
    },
    property_type: property.property_type,
    num_beds: property.bedrooms,
    num_baths: property.bathrooms,
    area_size: {
      value: property.square_feet,
      unit: 'sq_ft'
    },
    latitude: property.latitude,
    longitude: property.longitude
  }))
}

/**
 * Generate Ad Customizer feed data
 */
export const toAdCustomizerFeed = (
  aggregatedData: Array<{
    city: string
    property_type: string
    count: number
    min_price: number
    max_price: number
    currency: string
  }>,
  campaign: string,
  adGroup: string
): AdCustomizerFeedItem[] => {
  return aggregatedData.map((data, index) => ({
    'Target campaign': campaign,
    'Target ad group': adGroup,
    'Custom ID': `${data.city.toLowerCase().replace(/\s+/g, '-')}-${data.property_type.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    'City (text)': data.city,
    'Property count (number)': data.count,
    'Min price (price)': `${data.min_price} ${data.currency}`,
    'Max price (price)': `${data.max_price} ${data.currency}`,
    'Property type (text)': data.property_type,
    'Last updated (date)': new Date().toISOString().split('T')[0]
  }))
}

/**
 * Convert data to CSV format
 */
export const toCSV = <T extends Record<string, unknown>>(data: T[]): string => {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        const stringValue = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Convert data to XML format for Google Merchant/Shopping
 */
export const toXML = (
  properties: RemarketingPropertyData[],
  baseUrl: string,
  feedTitle: string,
  feedDescription: string
): string => {
  const items = properties
    .map(
      (property) => `
    <item>
      <g:id>${escapeXml(property.listing_id)}</g:id>
      <title>${escapeXml(property.name)}</title>
      <description>${escapeXml(generateDescription(property))}</description>
      <link>${escapeXml(`${baseUrl}/listing/${property.listing_id}`)}</link>
      <g:image_link>${escapeXml(property.image_url)}</g:image_link>
      <g:price>${property.price} ${property.currency}</g:price>
      <g:availability>${property.availability === 'sold' || property.availability === 'pending' ? 'out of stock' : 'in stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:google_product_category>2271</g:google_product_category>
      <g:product_type>Real Estate > ${escapeXml(property.property_type)}</g:product_type>
      <g:custom_label_0>${escapeXml(property.city)}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(property.property_type)}</g:custom_label_1>
      <g:custom_label_2>${property.bedrooms}bd</g:custom_label_2>
      <g:custom_label_3>${getPriceRange(property.price)}</g:custom_label_3>
    </item>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(feedDescription)}</description>
    ${items}
  </channel>
</rss>`
}
