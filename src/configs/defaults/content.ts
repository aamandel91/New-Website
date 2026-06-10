import { type Metadata } from 'next'

import { type ToolbarConfig } from '@templates/Header/components/ToolbarMenu'
import { tenant } from '@/configs/tenant.config'

const logo = tenant.visualIdentity.logo
const heroImages = tenant.visualIdentity.heroImages

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
  siteName: 'Florida Home Finder',
  siteDefaultBrokerageName: 'Florida Home Finder Real Estate',
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
  siteFooterDescription:
    'Florida Home Finder connects buyers and sellers with expert real estate professionals. We provide comprehensive property information, market insights, and innovative tools to make your real estate journey seamless.',
  siteFullscreenFooter: '',
  homepageHeroBlock: {
    title: 'Find Your Home in South Florida',
    subTitle:
      'Search homes for sale in Broward and Palm Beach County. Browse listings in Boca Raton, Parkland, Coral Springs, Delray Beach, and beyond.'
  },

  siteMetadata: {
    metadataBase: new URL('https://floridahomefinder.com'),
    title: {
      template: '%s | Florida Home Finder',
      default: 'Florida Home Finder - Find Your Dream Home in Florida'
    },
    alternates: {
      canonical: '/'
    },
    description:
      'Discover your perfect Florida home. Browse listings, connect with expert agents, and explore neighborhoods. Start your real estate journey with Florida Home Finder today.',
    keywords: [
      'homes for sale in Florida',
      'Florida real estate',
      'buy home Florida',
      'Florida properties',
      'real estate agent Florida',
      'Florida MLS listings'
    ],
    generator: 'Next.js',
    applicationName: 'Florida Home Finder',
    referrer: 'origin-when-cross-origin',
    creator: 'Florida Home Finder',
    publisher: 'Florida Home Finder',
    authors: [
      {
        name: 'Florida Home Finder',
        url: 'https://floridahomefinder.com'
      }
    ],
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png'
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://floridahomefinder.com',
      title: 'Florida Home Finder - Find Your Dream Home in Florida',
      description:
        'Discover thousands of properties and connect with experienced real estate agents across Florida.',
      siteName: 'Florida Home Finder',
      images: [
        {
          url: 'https://floridahomefinder.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Florida Home Finder - Find Your Dream Home'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Florida Home Finder - Find Your Dream Home in Florida',
      description:
        'Browse thousands of Florida properties and connect with expert real estate agents.',
      creator: '@FloridaHomeFinder',
      images: ['https://floridahomefinder.com/twitter-image.jpg']
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
      me: ['https://floridahomefinder.com']
    }
  } as Metadata,
  estimateMetadata: {
    title:
      'Florida Home Valuation - Get Your Free Property Estimate | Florida Home Finder',
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
