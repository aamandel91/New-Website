import React from 'react'

import PageTemplate from '@/components/templates/PageTemplate'
import HomePageContent from '@pages/home'

const HomePage = async () => {
  return (
    <PageTemplate>
      <HomePageContent />
    </PageTemplate>
  )
}

export default HomePage
