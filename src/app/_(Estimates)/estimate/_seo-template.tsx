/**
 * ESTIMATE/VALUATION PAGE - SEO IMPLEMENTATION TEMPLATE
 *
 * Apply this pattern to: /src/app/(Estimates)/estimate/[[...slugs]]/page.tsx
 *
 * This template shows how to:
 * - Generate metadata for valuation landing pages
 * - Create breadcrumbs for multi-step forms
 * - Optimize for "home valuation" keywords
 * - Add FAQ schema for common questions
 * - Handle canonical URLs for form pages
 *
 * Note: Estimate pages are typically client-side forms, so metadata
 * should focus on the landing state with CTAs
 */

import type { Metadata } from 'next'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema, faqSchema } from 'utils/structuredData'

/**
 * Static metadata for estimate landing page
 * The main entry point at /estimate
 */
export const metadata: Metadata = {
  title: 'Free Home Valuation Tool | Florida Home Finder',
  description:
    'Get a free instant home valuation for your property in Florida. AI-powered estimates based on recent comparables and market data.',
  keywords: [
    'home valuation',
    'home value estimate',
    'property valuation',
    'house value',
    'home worth',
    'home appraisal tool',
    'free home valuation',
    'Florida home value'
  ],
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: 'https://floridahomefinder.com/estimate'
  },
  openGraph: {
    type: 'website',
    title: 'Free Home Valuation Tool | Florida Home Finder',
    description: 'Get a free instant estimate of your home value in Florida',
    url: 'https://floridahomefinder.com/estimate',
    siteName: 'Florida Home Finder',
    images: [
      {
        url: 'https://floridahomefinder.com/estimate-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Home Valuation Tool'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Home Valuation | Florida Home Finder',
    description: 'Find out what your home is worth instantly',
    images: ['https://floridahomefinder.com/estimate-og-image.jpg']
  }
}

/**
 * Example estimate page component
 */
export default function EstimatePage(props: {
  params: { slugs?: string[] }
  searchParams?: Record<string, string>
}) {
  const estimateId = props.searchParams?.estimateId
  const step = props.searchParams?.step || '0'

  // Generate breadcrumbs based on current step
  const breadcrumbItems = [
    { name: 'Home', url: 'https://floridahomefinder.com' },
    { name: 'Home Valuation', url: 'https://floridahomefinder.com/estimate' }
  ]

  // Add step to breadcrumb if in multi-step process
  if (estimateId && parseInt(step) > 0) {
    breadcrumbItems.push({
      name: `Step ${parseInt(step) + 1}`,
      url: `https://floridahomefinder.com/estimate?step=${step}&estimateId=${estimateId}`
    })
  }

  const breadcrumbs = breadcrumbSchema(breadcrumbItems)

  // Generate FAQ schema with common valuation questions
  const estimateFaqs = faqSchema([
    {
      question: 'How does the home valuation tool work?',
      answer:
        'Our AI-powered tool analyzes recent property sales, current market conditions, property characteristics, and comparable homes in your area to provide an instant valuation estimate.'
    },
    {
      question: 'Is the valuation accurate?',
      answer:
        'Our valuations are based on publicly available data and market comparables. While highly accurate, they serve as estimates. For a precise appraisal, consult with a licensed appraiser.'
    },
    {
      question: 'How long does the valuation take?',
      answer: 'Most valuations are completed instantly after you provide basic property information. The entire process typically takes 3-5 minutes.'
    },
    {
      question: 'Is the valuation tool free?',
      answer: 'Yes! Our home valuation tool is completely free. No credit card required.'
    },
    {
      question: 'Can I use this valuation for a mortgage refinance?',
      answer:
        'While useful for getting a ballpark estimate, lenders typically require an official appraisal from a licensed appraiser for refinancing decisions.'
    },
    {
      question: 'What information do I need to get a valuation?',
      answer:
        'You\'ll need your property address, number of bedrooms and bathrooms, square footage (if known), and year built. The more details you provide, the more accurate the estimate.'
    }
  ])

  return (
    <>
      {/* Inject structured data */}
      <StructuredData data={breadcrumbs} />
      <StructuredData data={estimateFaqs} />

      {/* Your estimate form component */}
      <div className="estimate-page">
        <header className="estimate-header">
          <h1>Free Home Valuation Tool</h1>
          <p className="subtitle">Discover what your home is worth in minutes</p>
        </header>

        <section className="estimate-intro">
          <div className="benefits">
            <div className="benefit">
              <span className="icon">⚡</span>
              <h3>Instant Estimate</h3>
              <p>Get your valuation in seconds</p>
            </div>
            <div className="benefit">
              <span className="icon">🔒</span>
              <h3>100% Free & Secure</h3>
              <p>No credit card needed</p>
            </div>
            <div className="benefit">
              <span className="icon">📊</span>
              <h3>AI-Powered Analysis</h3>
              <p>Based on market data & comparables</p>
            </div>
          </div>
        </section>

        {/* Estimate form component would go here */}
        <section className="estimate-form">
          {/* TODO: Replace with your actual EstimatePage component */}
          <p>Estimate form would be rendered here</p>
        </section>

        <section className="how-it-works">
          <h2>How It Works</h2>
          <ol>
            <li>
              <h3>Enter Your Address</h3>
              <p>Start by providing your property address</p>
            </li>
            <li>
              <h3>Property Details</h3>
              <p>Tell us about your home (beds, baths, sq ft)</p>
            </li>
            <li>
              <h3>Get Your Estimate</h3>
              <p>Receive an AI-powered valuation instantly</p>
            </li>
            <li>
              <h3>Connect with Agents</h3>
              <p>Optionally connect with local real estate agents</p>
            </li>
          </ol>
        </section>

        <section className="faq">
          <h2>Frequently Asked Questions</h2>
          <details>
            <summary>How does the home valuation tool work?</summary>
            <p>
              Our AI-powered tool analyzes recent property sales, current market conditions, property characteristics,
              and comparable homes in your area to provide an instant valuation estimate.
            </p>
          </details>

          <details>
            <summary>Is the valuation accurate?</summary>
            <p>
              Our valuations are based on publicly available data and market comparables. While highly accurate, they
              serve as estimates. For a precise appraisal, consult with a licensed appraiser.
            </p>
          </details>

          <details>
            <summary>How long does the valuation take?</summary>
            <p>Most valuations are completed instantly after you provide basic property information. The entire process typically takes 3-5 minutes.</p>
          </details>

          <details>
            <summary>Is the valuation tool free?</summary>
            <p>Yes! Our home valuation tool is completely free. No credit card required.</p>
          </details>

          <details>
            <summary>What information do I need?</summary>
            <p>
              You'll need your property address, number of bedrooms and bathrooms, square footage (if known), and year
              built. The more details you provide, the more accurate the estimate.
            </p>
          </details>
        </section>
      </div>
    </>
  )
}
