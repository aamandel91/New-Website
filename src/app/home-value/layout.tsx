import type { Metadata } from 'next'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema } from 'utils/structuredData'

export const metadata: Metadata = {
  title: 'Home Value Estimate | Florida Home Finder',
  description:
    'Get a free home value estimate for any property in Florida. Enter your address to see what your home is worth today.',
  openGraph: {
    title: 'Home Value Estimate | Florida Home Finder',
    description:
      'Get a free home value estimate for any property in Florida. Enter your address to see what your home is worth today.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Home Value Estimate | Florida Home Finder',
    description:
      'Get a free home value estimate for any property in Florida. Enter your address to see what your home is worth today.',
  },
}

export default function HomeValueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://floridahomefinder.com' },
          { name: 'Home Value Estimate', url: 'https://floridahomefinder.com/home-value' },
        ])}
      />
      {children}
    </>
  )
}
