import React from 'react'
import { type Metadata } from 'next'

import Markdown from '@content/accessibility'
import { StaticPageTemplate } from '@templates'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema } from 'utils/structuredData'
import { tenant } from '@/configs/tenant.config'

const title = 'Accessibility Statement'
const url = `${tenant.brand.siteUrl}/accessibility`
const description = `${tenant.brand.siteName} is committed to digital accessibility for people with disabilities.`

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    title: `${title} | ${tenant.brand.siteName}`,
    description,
    url,
    siteName: tenant.brand.siteName,
  },
  twitter: {
    card: 'summary',
    title: `${title} | ${tenant.brand.siteName}`,
    description,
  },
}

const AccessibilityPage = () => {
  return (
    <StaticPageTemplate title={title}>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: tenant.brand.siteUrl },
          { name: title, url },
        ])}
      />
      <Markdown />
    </StaticPageTemplate>
  )
}

export default AccessibilityPage
