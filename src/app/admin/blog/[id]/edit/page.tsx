import { BlogEditor } from '@pages/blog'
import type { Metadata } from 'next'

interface EditBlogPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: 'Edit Blog | Admin',
  description: 'Edit an existing blog post'
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const blogId = parseInt(params.id, 10)

  if (isNaN(blogId)) {
    return <div>Invalid blog ID</div>
  }

  return <BlogEditor blogId={blogId} />
}
