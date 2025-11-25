/**
 * Utility functions for generating JSON-LD structured data
 * Improves search engine understanding and enables rich snippets
 */

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
    name: 'Florida Home Finder',
    description: 'Find your dream home in Florida with expert real estate agents',
    url: 'https://floridahomefinder.com',
    logo: 'https://floridahomefinder.com/logo.png',
    sameAs: [
      'https://www.facebook.com/floridahomefinder',
      'https://www.instagram.com/floridahomefinder',
      'https://www.linkedin.com/company/florida-home-finder',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Your Address Here',
      addressLocality: 'Florida',
      addressRegion: 'FL',
      postalCode: '00000',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-XXX-XXX-XXXX',
      contactType: 'Customer Service',
      email: 'info@floridahomefinder.com',
    },
    areaServed: {
      '@type': 'State',
      name: 'Florida',
    },
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
    url: `https://floridahomefinder.com/listings/${property.id}`,
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
    name: `Florida Home Finder - ${location.city}`,
    description: `Find homes in ${location.city}, ${location.state}`,
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
  }
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
