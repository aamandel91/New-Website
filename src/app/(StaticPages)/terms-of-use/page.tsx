import React from 'react'
import { type Metadata } from 'next'

import Markdown from '@content/terms-of-use'
import { StaticPageTemplate } from '@templates'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema } from 'utils/structuredData'
import { tenant } from '@/configs/tenant.config'

const title = 'Terms of Service'
const url = `${tenant.brand.siteUrl}/terms-of-use`
const description = `Terms of Service for ${tenant.brand.siteName}. Read our policies on account creation, content, intellectual property, and more.`

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

const TermsPage = () => {
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

export default TermsPage
