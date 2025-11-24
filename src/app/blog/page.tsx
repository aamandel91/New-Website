import { BlogListing } from '@pages/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Florida Home Finder',
  description: 'Discover insights and tips about real estate and lifestyle in Florida'
}

export default function BlogPage() {
  return <BlogListing />
}
