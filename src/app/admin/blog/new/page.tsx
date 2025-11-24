import { BlogEditor } from '@pages'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Blog | Admin',
  description: 'Create a new blog post'
}

export default function CreateBlogPage() {
  return <BlogEditor />
}
