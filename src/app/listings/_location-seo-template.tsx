/**
 * LOCATION-BASED LANDING PAGE - SEO IMPLEMENTATION TEMPLATE
 *
 * Use this pattern to create city/area specific landing pages:
 * - /listings/miami
 * - /listings/orlando
 * - /listings/tampa
 * - /listings/florida/miami (nested location)
 * - /listings/florida/miami/brickell (deeper nesting)
 *
 * This template shows how to:
 * - Generate location-specific metadata
 * - Add localBusinessSchema for local SEO
 * - Create location-based breadcrumbs
 * - Optimize for "homes for sale in [city]" keywords
 * - Add location-based FAQ schema
 */

import type { Metadata } from 'next'
import StructuredData from '@shared/StructuredData'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from 'utils/structuredData'

/**
 * Example location interface
 */
interface Location {
  name: string
  state: string
  zipCodes?: string[]
  country: string
  neighborhoods?: string[]
  activeListings: number
  averagePrice: number
  medianPrice: number
  properties: Array<{
    id: number
    address: string
    price: number
    bedrooms: number
    bathrooms: number
  }>
}

/**
 * Generate dynamic metadata for location pages
 */
export async function generateMetadata(props: {
  params: { slugs?: string[] }
}): Promise<Metadata> {
  // TODO: Fetch location data from your API
  // const location = await fetchLocationBySlug(params.slugs)

  // Example location data for template
  const location: Location = {
    name: 'Miami',
    state: 'FL',
    zipCodes: ['33101', '33102', '33103', '33104'],
    country: 'USA',
    neighborhoods: ['Brickell', 'Wynwood', 'Design District', 'Little Havana', 'Downtown'],
    activeListings: 2543,
    averagePrice: 645000,
    medianPrice: 525000,
    properties: [
      { id: 1, address: '123 Main St, Miami', price: 450000, bedrooms: 3, bathrooms: 2 },
      { id: 2, address: '456 Oak Ave, Miami', price: 650000, bedrooms: 4, bathrooms: 3 }
    ]
  }

  const avgPriceFormatted = `$${(location.averagePrice / 1000).toFixed(0)}k`

  return {
    title: `Homes for Sale in ${location.name}, ${location.state} | Florida Home Finder`,
    description: `Browse ${location.activeListings} homes for sale in ${location.name}, FL. Average price: ${avgPriceFormatted}. Find your dream home today.`,
    keywords: [
      `homes for sale in ${location.name}`,
      `${location.name} real estate`,
      `${location.name} houses for sale`,
      `buy home in ${location.name}`,
      `${location.name} FL properties`,
      `${location.name} neighborhoods`,
      ...(location.neighborhoods || []).map(n => `${n} ${location.name}`)
    ],
    alternates: {
      canonical: `https://floridahomefinder.com/listings/${location.name.toLowerCase()}`
    },
    openGraph: {
      type: 'website',
      title: `Homes for Sale in ${location.name}, FL`,
      description: `${location.activeListings} listings | Average: ${avgPriceFormatted}`,
      url: `https://floridahomefinder.com/listings/${location.name.toLowerCase()}`,
      siteName: 'Florida Home Finder'
    },
    twitter: {
      card: 'summary',
      title: `${location.name} Homes for Sale | Florida Home Finder`,
      description: `Browse ${location.activeListings} properties in ${location.name}`
    }
  }
}

/**
 * Example location page component
 */
export default function LocationPage(props: { params: { slugs?: string[] } }) {
  // TODO: Fetch actual location data
  const location: Location = {
    name: 'Miami',
    state: 'FL',
    zipCodes: ['33101', '33102', '33103', '33104'],
    country: 'USA',
    neighborhoods: ['Brickell', 'Wynwood', 'Design District', 'Little Havana', 'Downtown'],
    activeListings: 2543,
    averagePrice: 645000,
    medianPrice: 525000,
    properties: [
      { id: 1, address: '123 Main St, Miami', price: 450000, bedrooms: 3, bathrooms: 2 },
      { id: 2, address: '456 Oak Ave, Miami', price: 650000, bedrooms: 4, bathrooms: 3 }
    ]
  }

  // Generate local business schema for location
  const localBusinessData = localBusinessSchema({
    city: location.name,
    state: location.state,
    zipCode: location.zipCodes?.[0] || '',
    properties: location.activeListings,
    agents: 156 // TODO: Get actual agent count
  })

  // Generate breadcrumbs
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: 'https://floridahomefinder.com' },
    { name: 'Listings', url: 'https://floridahomefinder.com/listings' },
    { name: location.name, url: `https://floridahomefinder.com/listings/${location.name.toLowerCase()}` }
  ])

  // Generate location-specific FAQs
  const locationFaqs = faqSchema([
    {
      question: `What is the average home price in ${location.name}?`,
      answer: `The average home price in ${location.name}, FL is $${(location.averagePrice / 1000).toFixed(0)}k, with the median price at $${(location.medianPrice / 1000).toFixed(0)}k.`
    },
    {
      question: `How many homes are for sale in ${location.name}?`,
      answer: `Currently, there are ${location.activeListings} homes for sale in ${location.name}, FL on Florida Home Finder.`
    },
    {
      question: `What are the best neighborhoods in ${location.name}?`,
      answer: `Popular neighborhoods in ${location.name} include: ${location.neighborhoods?.join(', ')}.`
    },
    {
      question: `Why should I buy a home in ${location.name}?`,
      answer: `${location.name} offers diverse neighborhoods, vibrant culture, excellent weather, and strong real estate market growth.`
    }
  ])

  return (
    <>
      {/* Inject structured data */}
      <StructuredData data={localBusinessData} />
      <StructuredData data={breadcrumbs} />
      <StructuredData data={locationFaqs} />

      {/* Your location page content */}
      <div className="location-page">
        <header>
          <h1>Homes for Sale in {location.name}, {location.state}</h1>
          <p className="subtitle">
            Explore {location.activeListings} listings with average price {`$${(location.averagePrice / 1000).toFixed(0)}k`}
          </p>
        </header>

        <section className="location-stats">
          <div className="stat">
            <h3>{location.activeListings}</h3>
            <p>Active Listings</p>
          </div>
          <div className="stat">
            <h3>${(location.averagePrice / 1000).toFixed(0)}k</h3>
            <p>Average Price</p>
          </div>
          <div className="stat">
            <h3>${(location.medianPrice / 1000).toFixed(0)}k</h3>
            <p>Median Price</p>
          </div>
        </section>

        {location.neighborhoods && location.neighborhoods.length > 0 && (
          <section className="neighborhoods">
            <h2>Neighborhoods in {location.name}</h2>
            <div className="neighborhood-list">
              {location.neighborhoods.map(neighborhood => (
                <a
                  key={neighborhood}
                  href={`/listings/${location.name.toLowerCase()}/${neighborhood.toLowerCase()}`}
                  className="neighborhood-card"
                >
                  {neighborhood}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="featured-listings">
          <h2>Featured Homes in {location.name}</h2>
          <div className="listings-grid">
            {location.properties.map(property => (
              <a key={property.id} href={`/listing/${property.id}`} className="property-card">
                <div className="price">${property.price.toLocaleString()}</div>
                <div className="address">{property.address}</div>
                <div className="specs">
                  <span>{property.bedrooms} Beds</span>
                  <span>{property.bathrooms} Baths</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="faq">
          <h2>Frequently Asked Questions About {location.name}</h2>
          <details>
            <summary>What is the average home price in {location.name}?</summary>
            <p>
              The average home price in {location.name}, FL is ${(location.averagePrice / 1000).toFixed(0)}k, with the
              median price at ${(location.medianPrice / 1000).toFixed(0)}k.
            </p>
          </details>

          <details>
            <summary>How many homes are for sale in {location.name}?</summary>
            <p>Currently, there are {location.activeListings} homes for sale in {location.name}, FL on Florida Home Finder.</p>
          </details>

          <details>
            <summary>What are the best neighborhoods in {location.name}?</summary>
            <p>
              Popular neighborhoods in {location.name} include: {location.neighborhoods?.join(', ')}.
            </p>
          </details>
        </section>
      </div>
    </>
  )
}

/**
 * Generate static params for major Florida cities
 * Pre-render for better performance and SEO
 *
 * Uncomment and implement:
 */
// export async function generateStaticParams() {
//   const majorCities = [
//     'miami', 'orlando', 'tampa', 'jacksonville', 'fort-lauderdale',
//     'west-palm-beach', 'naples', 'orlando', 'daytona-beach', 'clearwater'
//   ]
//
//   return majorCities.map(city => ({
//     slugs: [city]
//   }))
// }
