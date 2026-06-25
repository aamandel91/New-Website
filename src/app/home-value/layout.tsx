import React from 'react'
import type { Metadata } from 'next'

import StructuredData from '@shared/StructuredData'
import { tenant } from '@/configs/tenant.config'

import { breadcrumbSchema } from 'utils/structuredData'

const homeValueTitle = `Home Value Estimate | ${tenant.brand.siteName}`
const homeValueDescription =
  'Get a free home value estimate for any property in Florida. Enter your address to see what your home is worth today.'

export const metadata: Metadata = {
  title: homeValueTitle,
  description: homeValueDescription,
  openGraph: {
    title: homeValueTitle,
    description: homeValueDescription,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: homeValueTitle,
    description: homeValueDescription
  }
}

export default function HomeValueLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: tenant.brand.siteUrl },
          {
            name: 'Home Value Estimate',
            url: `${tenant.brand.siteUrl}/home-value`
          }
        ])}
      />
      {children}
    </>
  )
}
