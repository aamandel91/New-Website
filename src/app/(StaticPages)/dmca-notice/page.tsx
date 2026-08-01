import React from 'react'
import { type Metadata } from 'next'

import Markdown from '@content/dmca-notice'
import StaticPageTemplate from '@/components/templates/StaticPageTemplate'
import { tenant } from '@/configs/tenant.config'
import StructuredData from '@shared/StructuredData'

import { breadcrumbSchema } from 'utils/structuredData'

const title = 'DMCA Notice'
const url = `${tenant.brand.siteUrl}/dmca-notice`
const description = `Digital Millennium Copyright Act (DMCA) notice and copyright information for ${tenant.brand.siteName}.`

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
    siteName: tenant.brand.siteName
  },
  twitter: {
    card: 'summary',
    title: `${title} | ${tenant.brand.siteName}`,
    description
  }
}

const DmcaPage = () => {
  return (
    <StaticPageTemplate title={title}>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: tenant.brand.siteUrl },
          { name: title, url }
        ])}
      />
      <Markdown />
    </StaticPageTemplate>
  )
}

export default DmcaPage
