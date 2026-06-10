import { generatePropertyUrl } from './propertyUrls'

// Uses normalized property fields from propertyDataMapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Property = any

/**
 * Generates JSON-LD structured data for a property listing
 * Following Schema.org RealEstateListing specification
 * https://schema.org/RealEstateListing
 */
export function generatePropertyJsonLd(property: Property, url: string) {
  const {
    mlsNumber,
    address,
    price,
    beds,
    baths,
    sqft,
    yearBuilt,
    lotSize,
    description,
    images = [],
    listingDate,
    propertyType,
    status
  } = property

  const fullAddress = address
    ? `${address.street}, ${address.city}, ${address.state} ${address.zip}`
    : ''

  // Format price
  const listPrice = price?.list || price?.current || 0

  // Get first image
  const mainImage = images.length > 0 ? images[0].url : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    url: url,
    name: fullAddress || `Property ${mlsNumber}`,
    description: description || `${beds} bed, ${baths} bath property for sale`,

    // Listing details
    ...(listingDate && { datePosted: new Date(listingDate).toISOString() }),
    ...(listPrice && {
      offers: {
        '@type': 'Offer',
        price: listPrice,
        priceCurrency: 'USD',
        availability:
          status?.toLowerCase() === 'active'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        ...(listingDate && {
          priceValidUntil: new Date(
            new Date(listingDate).setFullYear(
              new Date(listingDate).getFullYear() + 1
            )
          ).toISOString()
        })
      }
    }),

    // Property details
    numberOfRooms: beds || undefined,
    numberOfBedrooms: beds || undefined,
    numberOfBathroomsTotal: baths || undefined,
    floorSize: sqft
      ? {
          '@type': 'QuantitativeValue',
          value: sqft,
          unitCode: 'FTK', // Square foot
          unitText: 'sq ft'
        }
      : undefined,

    // Address
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress: address.street || '',
          addressLocality: address.city || '',
          addressRegion: address.state || '',
          postalCode: address.zip || '',
          addressCountry: 'US'
        }
      : undefined,

    // Geo coordinates (when the listing carries map data)
    ...(property.map?.latitude && property.map?.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: property.map.latitude,
            longitude: property.map.longitude
          }
        }
      : {}),

    // Containing place (city) — gives crawlers a stable entity reference
    ...(address?.city
      ? {
          containedInPlace: {
            '@type': 'Place',
            name: address.city,
            address: {
              '@type': 'PostalAddress',
              addressLocality: address.city,
              addressRegion: address.state || 'FL',
              addressCountry: 'US'
            }
          }
        }
      : {}),

    // Additional property information
    ...(yearBuilt && { yearBuilt }),
    ...(propertyType && { additionalType: propertyType }),
    ...(lotSize && {
      areaServed: {
        '@type': 'QuantitativeValue',
        value: lotSize,
        unitText: 'acres'
      }
    }),

    // Images
    ...(mainImage && { image: mainImage }),
    ...(images.length > 0 && {
      photo: images.map((img: any) => ({
        '@type': 'ImageObject',
        url: img.url,
        ...(img.caption && { caption: img.caption })
      }))
    }),

    // MLS information
    identifier: mlsNumber,
    productID: mlsNumber
  }

  // Remove undefined values
  return JSON.parse(JSON.stringify(jsonLd))
}

/**
 * Generates JSON-LD breadcrumb structured data for property page
 * https://schema.org/BreadcrumbList
 */
export function generatePropertyBreadcrumbJsonLd(
  property: Property,
  baseUrl: string
) {
  const { address } = property

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl
    }
  ]

  if (address?.state) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: address.state,
      item: `${baseUrl}/search?state=${address.state}`
    })
  }

  if (address?.city) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: address.city,
      item: `${baseUrl}/search?city=${address.city}&state=${address.state}`
    })
  }

  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: address?.street || `Property ${property.mlsNumber}`,
    item: `${baseUrl}${generatePropertyUrl(address || {}, property.mlsNumber)}`
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  }
}
