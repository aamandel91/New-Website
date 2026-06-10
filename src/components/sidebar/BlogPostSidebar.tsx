'use client'

import React from 'react'

import BlogArchives from './BlogArchives'
import BlogCategories from './BlogCategories'
import BlogTags from './BlogTags'
import SearchWidget from './SearchWidget'
import Sidebar from './Sidebar'
import TodaysListings from './TodaysListings'

export default function BlogPostSidebar() {
  return (
    <Sidebar
      widgets={[
        <BlogCategories key="categories" />,
        <BlogArchives key="archives" />,
        <BlogTags key="tags" />,
        <SearchWidget key="search" />,
        <TodaysListings key="listings" />
      ]}
    />
  )
}
