import type { Metadata } from 'next'

import { BlogListing } from '@pages/blog'
import { tenant } from '@/configs/tenant.config'

export const metadata: Metadata = {
  title: `Blog | ${tenant.brand.siteName}`,
  description:
    'Discover insights and tips about real estate and lifestyle in Florida'
}

export default function BlogPage() {
  return <BlogListing />
}
