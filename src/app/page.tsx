import React from 'react'
import type { Metadata } from 'next'

import PageTemplate from '@/components/templates/PageTemplate'
import { tenant } from '@/configs/tenant.config'
import { loadSiteSettings } from '@/utils/siteSettings'
import HomePageContent from '@pages/home'
import StructuredData from '@shared/StructuredData'

import {
  breadcrumbSchema,
  organizationSchema,
  websiteSearchSchema
} from 'utils/structuredData'

// NOTE: estimate-as-root is served via a rewrite in middleware.ts. Importing
// the Estimate page here (even behind a feature check) would register its
// client chunks — recharts, MUI date-pickers, estimate providers — on the
// homepage bundle.
export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await loadSiteSettings()

  return {
    title:
      settings.metaTitle ||
      `${tenant.brand.siteName} - Find Your Dream Home in Florida`,
    description:
      settings.metaDescription ||
      'Discover thousands of properties and connect with experienced real estate agents across Florida.',
    keywords: settings.metaKeywords || undefined,
    alternates: {
      canonical: '/'
    }
  }
}

const HomePage = async () => {
  const orgSchema = organizationSchema()
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: tenant.brand.siteUrl }
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
