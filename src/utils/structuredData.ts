/**
 * Utility functions for generating JSON-LD structured data
 * Improves search engine understanding and enables rich snippets
 */

import { siteSettings } from '@/configs/defaults/site-settings'
import { tenant } from '@/configs/tenant.config'

export interface StructuredDataProps {
  [key: string]: any
}

/**
 * Organization schema - for homepage and global brand info
 */
export function organizationSchema(): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `${tenant.brand.teamName} at ${tenant.brand.siteName}`,
    description:
      'South Florida real estate experts serving Broward and Palm Beach County. Find homes for sale in Boca Raton, Parkland, Coral Springs, Delray Beach, and beyond.',
    url: tenant.brand.siteUrl,
    logo: `${tenant.brand.siteUrl}/logo.png`,
    telephone: tenant.contact.phoneE164,
    email: tenant.contact.email,
    foundingDate: '2010',
    slogan: tenant.brand.slogan,
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: 18,
    },
    sameAs: [
      siteSettings.social.facebook,
      siteSettings.social.instagram,
      siteSettings.social.linkedin,
      siteSettings.social.youtube,
      siteSettings.social.zillow,
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: tenant.contact.address.street,
      addressLocality: tenant.contact.address.city,
      addressRegion: tenant.contact.address.state,
      postalCode: tenant.contact.address.zip,
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: tenant.contact.phoneE164,
      contactType: 'Customer Service',
      email: tenant.contact.email,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Miami-Dade County', containedIn: { '@type': 'State', name: 'Florida' } },
      { '@type': 'AdministrativeArea', name: 'Broward County', containedIn: { '@type': 'State', name: 'Florida' } },
      { '@type': 'AdministrativeArea', name: 'Palm Beach County', containedIn: { '@type': 'State', name: 'Florida' } },
      { '@type': 'AdministrativeArea', name: 'Martin County', containedIn: { '@type': 'State', name: 'Florida' } },
      { '@type': 'AdministrativeArea', name: 'St. Lucie County', containedIn: { '@type': 'State', name: 'Florida' } }
    ],
  }
}

/**
 * Property/Real Estate Listing schema
 */
export function propertySchema(property: {
  id: string
  title: string
  description: string
  price: number
  address: string
  bedrooms: number
  bathrooms: number
  squareFeet: number
  image: string
  agentName: string
  agentEmail: string
}): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateProperty',
    name: property.title,
    description: property.description,
    url: `${tenant.brand.siteUrl}/listings/${property.id}`,
    image: property.image,
    price: property.price.toString(),
    priceCurrency: 'USD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressCountry: 'US',
      addressRegion: 'FL',
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.squareFeet.toString(),
      unitCode: 'FT2',
    },
    agent: {
      '@type': 'RealEstateAgent',
      name: property.agentName,
      email: property.agentEmail,
    },
  }
}

/**
 * Agent/Person schema for agent profiles
 */
export function agentSchema(agent: {
  name: string
  title: string
  bio: string
  image: string
  email: string
  phone: string
  specialties: string[]
}): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    jobTitle: agent.title,
    description: agent.bio,
    image: agent.image,
    email: agent.email,
    telephone: agent.phone,
    knowsAbout: agent.specialties,
    areaServed: {
      '@type': 'State',
      name: 'Florida',
    },
  }
}

/**
 * Blog Post/Article schema
 */
export function articleSchema(article: {
  title: string
  description: string
  content: string
  image: string
  author: string
  publishedDate: Date
  modifiedDate?: Date
  url: string
}): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    image: article.image,
    articleBody: article.content,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    datePublished: article.publishedDate.toISOString(),
    dateModified: article.modifiedDate?.toISOString() || article.publishedDate.toISOString(),
    url: article.url,
  }
}

/**
 * Breadcrumb schema for navigation hierarchy
 */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Local Business schema for location-based services
 */
export function localBusinessSchema(location: {
  city: string
  state: string
  zipCode: string
  properties?: number
  agents?: number
}): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${tenant.brand.siteName} - ${location.city}`,
    description: `Find homes in ${location.city}, ${location.state}`,
    url: 'https://soldbymandelteam.com',
    telephone: siteSettings.phone,
    priceRange: '$$$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.city,
      addressRegion: location.state,
      postalCode: location.zipCode,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: location.city,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '08:00',
        closes: '20:00',
      },
    ],
  }
}

/**
 * WebSite schema with SearchAction for sitelinks search box
 */
export function websiteSearchSchema(): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: tenant.brand.siteName,
    url: tenant.brand.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${tenant.brand.siteUrl}/search/gallery?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

/**
 * Place schema for a city landing page. Optionally enriched with an
 * AggregateRating (e.g. average of nearby school ratings).
 */
export function placeSchema(params: {
  cityName: string
  state?: string
  countyName?: string
  lat?: number
  lng?: number
  url: string
  aggregateRating?: { ratingValue: number; reviewCount: number }
}): StructuredDataProps {
  const schema: StructuredDataProps = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: params.cityName,
    url: params.url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: params.cityName,
      addressRegion: params.state || 'FL',
      addressCountry: 'US',
    },
  }
  if (typeof params.lat === 'number' && typeof params.lng === 'number') {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: params.lat,
      longitude: params.lng,
    }
  }
  if (params.countyName) {
    schema.containedInPlace = {
      '@type': 'AdministrativeArea',
      name: params.countyName,
    }
  }
  if (params.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: params.aggregateRating.ratingValue.toFixed(1),
      reviewCount: params.aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    }
  }
  return schema
}

/**
 * EducationalOrganization schema for a single nearby school.
 */
export function educationalOrganizationSchema(params: {
  name: string
  cityName?: string
  state?: string
  level?: string
  rating?: number
}): StructuredDataProps {
  const schema: StructuredDataProps = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: params.name,
  }
  if (params.cityName) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: params.cityName,
      addressRegion: params.state || 'FL',
      addressCountry: 'US',
    }
  }
  if (params.level) {
    schema.educationalLevel = params.level
  }
  if (params.rating !== undefined) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: params.rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount: 1,
    }
  }
  return schema
}

/**
 * FAQPage schema for FAQ sections
 */
export function faqSchema(
  faqs: Array<{
    question: string
    answer: string
  }>
): StructuredDataProps {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
