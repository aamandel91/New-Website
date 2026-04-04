import React, { Suspense, type ComponentType } from 'react'
import { type Metadata, type Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import { getLocale, getMessages } from 'next-intl/server'

import { GlobalStyles } from '@mui/material'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

import content from '@configs/content'
import globalStyles from '@configs/theme/global'
import TrackingInline from '@templates/TrackingInline'
import GoogleTagManager, { GoogleTagManagerNoscript } from '@/components/analytics/GoogleTagManager'
import GTMPageView from '@/components/analytics/GTMPageView'
import RemarketingPixels from '@/components/analytics/RemarketingPixels'
import SureSendPixel from '@/components/analytics/SureSendPixel'

import { APISearch } from 'services/API'
import { fetchFeatureOptions } from 'utils/features'

import 'styles/globals.css'

import Providers from './_providers'
import AgentSubdomainSEO from '@/components/shared/AgentSubdomainSEO'

const gbInitMode = process.env.NEXT_PUBLIC_GROWTHBOOK_INIT || 'ssg'

export const metadata: Metadata = content.siteMetadata

export const viewport: Viewport = {
  themeColor: 'white',
  width: 'device-width',
  initialScale: 1
  // interactiveWidget: 'resizes-visual'
}

export type ProviderComponent = [ComponentType<any>, object?]

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const { features, options } = await fetchFeatureOptions(gbInitMode)

  const locations = features.search
    ? await APISearch.fetchLocations({
        next: { tags: ['locations'], revalidate: 86400 }
      })
    : null

  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={montserrat.variable}>
      <head>
        <GoogleTagManager />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        {/* TODO: Add hreflang tags when Spanish content is available */}
        {/* <link rel="alternate" hreflang="en" href="https://floridahomefinder.com{path}" /> */}
        {/* <link rel="alternate" hreflang="es" href="https://floridahomefinder.com/es{path}" /> */}
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`
          }}
        />
        <GoogleTagManagerNoscript />
        <Suspense>
          <GTMPageView />
        </Suspense>
        <TrackingInline />
        <RemarketingPixels />
        <SureSendPixel />
        <GlobalStyles styles={globalStyles} />
        <Providers
          locale={locale}
          messages={messages}
          features={features}
          featureOptions={options}
          locations={locations}
        >
          <AgentSubdomainSEO />
          {children}
        </Providers>
      </body>
    </html>
  )
}

export default Layout
