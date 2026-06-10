'use client'

import React from 'react'

import BuyerResources from './BuyerResources'
import ReadyToChat from './ReadyToChat'
import RecentBlogs from './RecentBlogs'
import SearchWidget from './SearchWidget'
import SellerResources from './SellerResources'
import Sidebar from './Sidebar'

export default function SellPageSidebar() {
  return (
    <Sidebar
      widgets={[
        <SearchWidget key="search" />,
        <ReadyToChat key="chat" />,
        <SellerResources key="seller" />,
        <BuyerResources key="buyer" />,
        <RecentBlogs key="blogs" />
      ]}
    />
  )
}
