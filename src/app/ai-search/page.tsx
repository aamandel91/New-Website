import { type Metadata } from 'next'

import { PageTemplate } from '@templates'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema } from 'utils/structuredData'
import { tenant } from '@/configs/tenant.config'

import { AiMapListings } from '@pages/ai-search'

const SITE_URL = tenant.brand.siteUrl
const SITE_NAME = tenant.brand.siteName
const TEAM_NAME = tenant.brand.teamName || SITE_NAME

const TITLE = `AI Property Search | ${TEAM_NAME}`
const DESCRIPTION = `Describe what you're looking for in plain English — "3 bedroom condos in Boca under 900k with a pool" — and ${TEAM_NAME}'s AI search will turn it into a live map of matching homes.`
const URL = `${SITE_URL}/ai-search`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function AiSearchPage() {
  return (
    <PageTemplate noFooter>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'AI Search', url: URL },
        ])}
      />
      <AiMapListings />
    </PageTemplate>
  )
}
