import React from 'react'
import { type Metadata } from 'next'

import Markdown from '@content/privacy-policy'
import { StaticPageTemplate } from '@templates'
import { tenant } from '@/configs/tenant.config'
import StructuredData from '@shared/StructuredData'

import { breadcrumbSchema } from 'utils/structuredData'

const title = 'Privacy Policy'
const url = `${tenant.brand.siteUrl}/privacy-policy`
const description = `Privacy Policy for ${tenant.brand.siteName}. Read about how we collect, use, and protect your personal information.`

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

const PrivacyPolicyPage = () => {
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

export default PrivacyPolicyPage
