import { type Metadata } from 'next'

import { type ToolbarConfig } from '@templates/Header/components/ToolbarMenu'
import { tenant } from '@/configs/tenant.config'

const logo = tenant.visualIdentity.logo
const heroImages = tenant.visualIdentity.heroImages
const brand = tenant.brand
// Social handle derived from the brand name (e.g. "Florida Home Finder" →
// "@FloridaHomeFinder"); keeps the Twitter creator tag brand-correct per tenant.
const socialHandle = `@${brand.siteName.replace(/\s+/g, '')}`

const content = {
  siteLogo: { url: logo.src, width: logo.width, height: logo.height },
  siteMobileLogo: { url: logo.src, width: logo.width, height: logo.height },
  siteFooterLogo: {
    url: logo.footerSrc,
    width: logo.footerWidth,
    height: logo.footerHeight
  },
  siteSplashscreen: heroImages.homepage,
  loginSplashscreen: heroImages.homepage,
  siteName: brand.siteName,
  siteDefaultBrokerageName: `${brand.siteName} Real Estate`,
  siteKeywords: [
    'homes for sale in Florida',
    'Florida real estate',
    'buy home Florida',
    'Florida properties',
    'real estate agent Florida',
    'Florida MLS listings',
    'houses for sale Florida'
  ],
  siteDescription:
    'Find your dream home in Florida. Browse thousands of listings, connect with expert real estate agents, and discover neighborhoods across the state.',
  siteFooterDescription: `${brand.siteName} connects buyers and sellers with expert real estate professionals. We provide comprehensive property information, market insights, and innovative tools to make your real estate journey seamless.`,
  siteFullscreenFooter: '',
  homepageHeroBlock: {
    title: 'Find Your Home in South Florida',
    subTitle:
      'Search homes for sale in Broward and Palm Beach County. Browse listings in Boca Raton, Parkland, Coral Springs, Delray Beach, and beyond.'
  },

  siteMetadata: {
    metadataBase: new URL(brand.siteUrl),
    title: {
      template: `%s | ${brand.siteName}`,
      default: `${brand.siteName} - Find Your Dream Home in Florida`
    },
    alternates: {
      canonical: '/'
    },
    description: `Discover your perfect Florida home. Browse listings, connect with expert agents, and explore neighborhoods. Start your real estate journey with ${brand.siteName} today.`,
    keywords: [
      'homes for sale in Florida',
      'Florida real estate',
      'buy home Florida',
      'Florida properties',
      'real estate agent Florida',
      'Florida MLS listings'
    ],
    generator: 'Next.js',
    applicationName: brand.siteName,
    referrer: 'origin-when-cross-origin',
    creator: brand.siteName,
    publisher: brand.siteName,
    authors: [
      {
        name: brand.siteName,
        url: brand.siteUrl
      }
    ],
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png'
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: brand.siteUrl,
      title: `${brand.siteName} - Find Your Dream Home in Florida`,
      description:
        'Discover thousands of properties and connect with experienced real estate agents across Florida.',
      siteName: brand.siteName,
      images: [
        {
          url: `${brand.siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${brand.siteName} - Find Your Dream Home`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand.siteName} - Find Your Dream Home in Florida`,
      description:
        'Browse thousands of Florida properties and connect with expert real estate agents.',
      creator: socialHandle,
      images: [`${brand.siteUrl}/twitter-image.jpg`]
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1
      }
    },
    verification: {
      google: 'your-google-search-console-code',
      yandex: 'your-yandex-code',
      me: [brand.siteUrl]
    }
  } as Metadata,
  estimateMetadata: {
    title: `Florida Home Valuation - Get Your Free Property Estimate | ${brand.siteName}`,
    description:
      'Get an instant, accurate home valuation for your Florida property. Our AI-powered tool provides comprehensive market analysis and pricing insights.'
  } as Metadata,
  estimateResultMetadata: {
    title: '$ Property Valuation Report',
    description:
      'View your comprehensive $ home valuation from HomeIQ. AI-powered insights, neighbourhood trends, and market data for informed decisions.'
  } as Metadata,
  missingPropertyMetadata: {
    title: "Listing you are looking for isn't there.",
    description: "Listing you are looking for isn't there."
  } as Metadata,
  restrictedPropertyTitle:
    'This listing is only visible to registered users due to MLS compliance.',
  estimateBoardRegulations: '',
  toolbarMenuItems: [] as ToolbarConfig[]
}

export default content
