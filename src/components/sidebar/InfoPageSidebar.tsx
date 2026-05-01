'use client'

import React from 'react'
import Sidebar from './Sidebar'
import SearchWidget from './SearchWidget'
import TodaysListings from './TodaysListings'
import RecentBlogs from './RecentBlogs'

export default function InfoPageSidebar() {
  return (
    <Sidebar
      widgets={[
        <SearchWidget key="search" />,
        <TodaysListings key="listings" />,
        <RecentBlogs key="blogs" />,
      ]}
    />
  )
}
