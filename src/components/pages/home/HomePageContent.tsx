'use client'

import { Box } from '@mui/material'

import ExploreLifestyles from './components/ExploreLifestyles'

import BlogSection from './components/BlogSection'
import CTACards from './components/CTACards'
import ExploreListings from './components/ExploreListings'
import HeroSection from './components/HeroSection'
import HomeValueWidget from './components/HomeValueWidget'
import SEOContentBlock from './components/SEOContentBlock'

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
