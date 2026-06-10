import type { Metadata } from 'next'

import { BlogEditor } from '@pages/blog'

export const metadata: Metadata = {
  title: 'Create Blog | Admin',
  description: 'Create a new blog post'
}

export default function CreateBlogPage() {
  return <BlogEditor />
}
