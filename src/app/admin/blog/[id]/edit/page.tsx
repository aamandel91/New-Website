import type { Metadata } from 'next'

import { BlogEditor } from '@pages/blog'

interface EditBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Edit Blog | Admin',
  description: 'Edit an existing blog post'
}

export default async function EditBlogPage(props: EditBlogPageProps) {
  const params = await props.params
  const blogId = parseInt(params.id, 10)

  if (isNaN(blogId)) {
    return <div>Invalid blog ID</div>
  }

  return <BlogEditor blogId={blogId} />
}
