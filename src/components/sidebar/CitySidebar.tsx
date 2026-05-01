'use client'

import React from 'react'
import Sidebar from './Sidebar'
import SearchWidget from './SearchWidget'
import HowsTheMarket from './HowsTheMarket'
import BrowseByType from './BrowseByType'
import PopularSearches from './PopularSearches'
import RecentBlogs from './RecentBlogs'

interface CitySidebarProps {
  city: string
  neighborhood?: string
}

export default function CitySidebar({ city, neighborhood }: CitySidebarProps) {
  return (
    <Sidebar
      widgets={[
        <SearchWidget key="search" />,
        <HowsTheMarket key="market" city={city} neighborhood={neighborhood} />,
        <BrowseByType key="browse" city={city} />,
        <PopularSearches key="popular" city={city} />,
        <RecentBlogs key="blogs" city={city} />,
      ]}
    />
  )
}
