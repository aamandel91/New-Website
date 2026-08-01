'use client'

import dynamic from 'next/dynamic'

import { Box } from '@mui/material'

import HeroSection from './components/HeroSection'

// Below-the-fold sections load in their own chunks. SSR stays on (default),
// so the server HTML and SEO output are unchanged — only the client bundle
// for the initial paint gets smaller.
const ExploreListings = dynamic(() => import('./components/ExploreListings'))
const CTACards = dynamic(() => import('./components/CTACards'))
const ExploreLifestyles = dynamic(() => import('./components/ExploreLifestyles'))
const HomeValueWidget = dynamic(() => import('./components/HomeValueWidget'))
const BlogSection = dynamic(() => import('./components/BlogSection'))
const SEOContentBlock = dynamic(() => import('./components/SEOContentBlock'))

const HomePageContent = () => (
  <Box>
    <HeroSection />
    <ExploreListings />
    <CTACards />
    <ExploreLifestyles />
    <HomeValueWidget />
    <BlogSection />
    <SEOContentBlock />
  </Box>
)

export default HomePageContent
