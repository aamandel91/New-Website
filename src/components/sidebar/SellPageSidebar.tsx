'use client'

import React from 'react'
import Sidebar from './Sidebar'
import SearchWidget from './SearchWidget'
import ReadyToChat from './ReadyToChat'
import SellerResources from './SellerResources'
import BuyerResources from './BuyerResources'
import RecentBlogs from './RecentBlogs'

export default function SellPageSidebar() {
  return (
    <Sidebar
      widgets={[
        <SearchWidget key="search" />,
        <ReadyToChat key="chat" />,
        <SellerResources key="seller" />,
        <BuyerResources key="buyer" />,
        <RecentBlogs key="blogs" />,
      ]}
    />
  )
}
