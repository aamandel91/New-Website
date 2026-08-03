import { type Metadata } from 'next'

import Markdown from '@content/cookies-policy'
import StaticPageTemplate from '@/components/templates/StaticPageTemplate'
import { tenant } from '@/configs/tenant.config'
import StructuredData from '@shared/StructuredData'

import { breadcrumbSchema } from 'utils/structuredData'

const title = 'Our Cookies Policy'
const url = `${tenant.brand.siteUrl}/cookies-policy`
const description = `Learn how ${tenant.brand.siteName} uses cookies and similar technologies.`

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

const CookiePage = () => {
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

export default CookiePage
