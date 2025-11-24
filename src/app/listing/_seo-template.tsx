/**
 * PROPERTY LISTING PAGE - SEO IMPLEMENTATION TEMPLATE
 *
 * Apply this pattern to: /src/app/listing/[[...listingName]]/page.tsx
 *
 * This template shows how to:
 * - Generate dynamic metadata for property listings
 * - Add JSON-LD propertySchema for rich snippets
 * - Create breadcrumbs for navigation
 * - Handle canonical URLs
 * - Optimize Open Graph for social sharing
 */

import type { Metadata } from 'next'
import StructuredData from '@shared/StructuredData'
import { propertySchema, breadcrumbSchema } from 'utils/structuredData'

/**
 * Example interface - adapt to your actual property data structure
 */
interface PropertyData {
  id: number
  slug: string
  address: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  featured_image_url: string
  agent_name: string
  agent_email: string
  city: string
  state: string
  zipCode: string
  published_at: Date
  updated_at: Date
}

/**
 * Generate dynamic metadata for each property listing
 * This runs on server and sets the page's meta tags
 */
export async function generateMetadata(props: {
  params: { listingName?: string[] }
  searchParams?: Record<string, string | string[]>
}): Promise<Metadata> {
  // TODO: Fetch actual property data from your API
  // const property = await fetchPropertyBySlug(params.listingName?.[0])

  // Example property for template
  const property: PropertyData = {
    id: 123456,
    slug: 'luxury-home-miami-beach',
    address: '123 Ocean Drive, Miami Beach, FL 33139',
    title: 'Luxury Waterfront Home in Miami Beach',
    description: 'Beautiful 4-bedroom, 3-bathroom luxury waterfront home with ocean views',
    price: 2500000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 4500,
    featured_image_url: 'https://floridahomefinder.com/property-image.jpg',
    agent_name: 'John Smith',
    agent_email: 'john@floridahomefinder.com',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    published_at: new Date('2024-01-15'),
    updated_at: new Date('2024-11-24')
  }

  // Fallback metadata if property not found
  if (!property) {
    return {
      title: 'Property Listing | Florida Home Finder',
      description: 'Browse our available property listings',
      robots: { index: false }
    }
  }

  const priceRange = property.price ? `$${(property.price / 1000000).toFixed(1)}M` : 'Price Upon Request'

  return {
    title: `${property.address} - ${priceRange} | Florida Home Finder`,
    description: `${property.bedrooms}BR/${property.bathrooms}BA - ${property.title}. ${property.description} in ${property.city}, FL.`,
    keywords: [
      `homes for sale in ${property.city}`,
      `${property.city} real estate`,
      `${property.bedrooms} bedroom homes ${property.city}`,
      property.address,
      'Florida homes',
      'real estate listing'
    ],
    alternates: {
      canonical: `https://floridahomefinder.com/listing/${property.slug}`
    },
    openGraph: {
      type: 'website',
      title: `${property.address} | ${priceRange}`,
      description: `${property.bedrooms}BR / ${property.bathrooms}BA - ${property.squareFeet.toLocaleString()} sq ft`,
      url: `https://floridahomefinder.com/listing/${property.slug}`,
      siteName: 'Florida Home Finder',
      images: [
        {
          url: property.featured_image_url,
          width: 1200,
          height: 630,
          alt: property.title,
          type: 'image/jpeg'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${property.address} - ${priceRange}`,
      description: `${property.bedrooms}BR/${property.bathrooms}BA in ${property.city}, FL`,
      images: [property.featured_image_url],
      creator: '@FloridaHomeFinder'
    }
  }
}

/**
 * Example listing page component
 */
export default function ListingPage(props: {
  params: { listingName?: string[] }
  searchParams?: Record<string, string | string[]>
}) {
  // TODO: Fetch actual property data from your API
  const property: PropertyData = {
    id: 123456,
    slug: 'luxury-home-miami-beach',
    address: '123 Ocean Drive, Miami Beach, FL 33139',
    title: 'Luxury Waterfront Home in Miami Beach',
    description: 'Beautiful 4-bedroom, 3-bathroom luxury waterfront home with ocean views',
    price: 2500000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 4500,
    featured_image_url: 'https://floridahomefinder.com/property-image.jpg',
    agent_name: 'John Smith',
    agent_email: 'john@floridahomefinder.com',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    published_at: new Date('2024-01-15'),
    updated_at: new Date('2024-11-24')
  }

  // Generate property schema for rich snippets
  const propertyStructuredData = propertySchema({
    id: property.id.toString(),
    title: property.address,
    description: property.description,
    price: property.price,
    address: property.address,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    image: property.featured_image_url,
    agentName: property.agent_name,
    agentEmail: property.agent_email
  })

  // Generate breadcrumb schema
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: 'https://floridahomefinder.com' },
    { name: 'Listings', url: 'https://floridahomefinder.com/listings' },
    { name: property.city, url: `https://floridahomefinder.com/listings/${property.city.toLowerCase()}` },
    { name: property.address, url: `https://floridahomefinder.com/listing/${property.slug}` }
  ])

  return (
    <>
      {/* Inject structured data into page head */}
      <StructuredData data={propertyStructuredData} />
      <StructuredData data={breadcrumbs} />

      {/* Your property listing content goes here */}
      <div className="listing-page">
        <h1>{property.address}</h1>
        <div className="price">${property.price.toLocaleString()}</div>
        <div className="details">
          <span>{property.bedrooms} Beds</span>
          <span>{property.bathrooms} Baths</span>
          <span>{property.squareFeet.toLocaleString()} Sq Ft</span>
        </div>
        <img src={property.featured_image_url} alt={property.title} />
        <p>{property.description}</p>
        <div className="agent-info">
          <p>Listed by: {property.agent_name}</p>
          <p>Email: {property.agent_email}</p>
        </div>
      </div>
    </>
  )
}

/**
 * Generate static params for pre-rendering popular listings
 * This helps with SEO by pre-rendering pages and improves performance
 *
 * Uncomment and implement when ready:
 */
// export async function generateStaticParams() {
//   // TODO: Fetch popular/recent listings from your API
//   const listings = await fetchPopularListings(100)
//
//   return listings.map(listing => ({
//     listingName: [listing.slug]
//   }))
// }
