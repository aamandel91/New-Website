import React from 'react'
import type { Metadata } from 'next'

import { PageTemplate } from '@templates'
import HomePageContent from '@pages/home'
import StructuredData from '@shared/StructuredData'

import EstimatePage, {
  generateMetadata as generateEstimateMetadata
} from 'app/(Estimates)/estimate/[[...slugs]]/page'

import { fetchFeatures } from 'utils/features'
import { organizationSchema, breadcrumbSchema, websiteSearchSchema } from 'utils/structuredData'

// NOTE: Dynamically generate metadata for the Estimate Landing Page based on feature flags.
// When manually setting rootPage with feature flags for the estimate page,
// Next.js does not recognize EstimatePage as a page component and skips page-level metadata configuration.
// To prevent this, metadata must be generated dynamically using feature flags.
export const generateMetadata = async (props: any): Promise<Metadata> => {
  const features = await fetchFeatures()

  if (features.rootPage === 'estimate') {
    // landing page metadata
    return await generateEstimateMetadata(props)
  }

  return {
    title: 'Florida Home Finder - Find Your Dream Home in Florida',
    description: 'Discover thousands of properties and connect with experienced real estate agents across Florida.',
    alternates: {
      canonical: '/'
    }
  }
}

const HomePage = async (props: any) => {
  const features = await fetchFeatures()

  if (features.rootPage === 'estimate')
    return await (<EstimatePage {...props} />)

  const orgSchema = organizationSchema()
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: 'https://floridahomefinder.com' }
  ])
  const siteSearch = websiteSearchSchema()

  return (
    <>
      <StructuredData data={orgSchema} />
      <StructuredData data={breadcrumbs} />
      <StructuredData data={siteSearch} />
      <PageTemplate>
        <HomePageContent />
      </PageTemplate>
    </>
  )
}

export default HomePage
