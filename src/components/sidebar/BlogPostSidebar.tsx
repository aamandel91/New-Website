'use client'

import React from 'react'
import { Sidebar } from '@/components/sidebar'
import BlogCategories from './BlogCategories'
import BlogArchives from './BlogArchives'
import BlogTags from './BlogTags'
import SearchWidget from './SearchWidget'
import TodaysListings from './TodaysListings'

export default function BlogPostSidebar() {
  return (
    <Sidebar
      widgets={[
        <BlogCategories key="categories" />,
        <BlogArchives key="archives" />,
        <BlogTags key="tags" />,
        <SearchWidget key="search" />,
        <TodaysListings key="listings" />,
      ]}
    />
  )
}
