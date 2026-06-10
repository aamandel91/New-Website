'use client'

import React from 'react'

import RecentBlogs from './RecentBlogs'
import SearchWidget from './SearchWidget'
import Sidebar from './Sidebar'
import TodaysListings from './TodaysListings'

export default function InfoPageSidebar() {
  return (
    <Sidebar
      widgets={[
        <SearchWidget key="search" />,
        <TodaysListings key="listings" />,
        <RecentBlogs key="blogs" />
      ]}
    />
  )
}
