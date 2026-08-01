import { Box } from '@mui/material'

import LazyHydrate from '@shared/LazyHydrate'

import BlogSection from './components/BlogSection'
import CTACards from './components/CTACards'
import ExploreLifestyles from './components/ExploreLifestyles'
import ExploreListings from './components/ExploreListings'
import HeroSection from './components/HeroSection'
import HomeValueWidget from './components/HomeValueWidget'
import SEOContentBlock from './components/SEOContentBlock'

// Server component: sections render into the HTML normally (SEO unchanged),
// but everything below the fold hydrates lazily via LazyHydrate — Lighthouse
// and real first paints don't pay for their JS execution.
const HomePageContent = () => (
  <Box>
    <HeroSection />
    <LazyHydrate>
      <ExploreListings />
    </LazyHydrate>
    <LazyHydrate>
      <CTACards />
    </LazyHydrate>
    <LazyHydrate>
      <ExploreLifestyles />
    </LazyHydrate>
    <LazyHydrate>
      <HomeValueWidget />
    </LazyHydrate>
    <LazyHydrate>
      <BlogSection />
    </LazyHydrate>
    <LazyHydrate>
      <SEOContentBlock />
    </LazyHydrate>
  </Box>
)

export default HomePageContent
