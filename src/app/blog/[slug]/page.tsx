import { Suspense } from 'react'
import { Box, Container, Typography, CircularProgress } from '@mui/material'
import type { Metadata } from 'next'
import { BlogDisplay, BlogListing } from '@pages/blog'
import StructuredData from '@shared/StructuredData'
import PageWithSidebar from '@/components/layouts/PageWithSidebar'
import BlogPostSidebar from '@/components/sidebar/BlogPostSidebar'
import { articleSchema, breadcrumbSchema } from 'utils/structuredData'
import type { Blog } from '@/types/blog'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

async function fetchBlogServer(slug: string): Promise<Blog | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || ''
    const res = await fetch(`${apiUrl}/api/blogs/${slug}`, {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.blog || null
  } catch {
    return null
  }
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
  const params = await props.params
  const blog = await fetchBlogServer(params.slug)

  if (!blog) {
    return {
      title: 'Blog Post | Florida Home Finder',
      description: 'Read our latest blog post about real estate and lifestyle',
      robots: { index: false }
    }
  }

  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.description,
    keywords: blog.meta_keywords && blog.meta_keywords.length > 0 ? blog.meta_keywords : blog.tags,
    alternates: {
      canonical: `https://floridahomefinder.com/blog/${blog.slug}`
    },
    openGraph: {
      type: 'article',
      publishedTime: blog.published_at ? new Date(blog.published_at).toISOString() : undefined,
      modifiedTime: new Date(blog.updated_at).toISOString(),
      authors: [blog.author_email],
      tags: blog.tags,
      title: blog.title,
      description: blog.description,
      url: `https://floridahomefinder.com/blog/${blog.slug}`,
      siteName: 'Florida Home Finder',
      ...(blog.featured_image_url && {
        images: [
          {
            url: blog.featured_image_url,
            width: 1200,
            height: 630,
            alt: blog.title,
            type: 'image/jpeg'
          }
        ]
      })
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.description,
      ...(blog.featured_image_url && {
        images: [blog.featured_image_url]
      }),
      creator: '@FloridaHomeFinder'
    }
  }
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const params = await props.params
  const blog = await fetchBlogServer(params.slug)

  const handleRelatedBlogs = (blogs: any[]) => {
    console.log('Related blogs:', blogs)
  }

  return (
    <Box>
      {blog && (
        <>
          <StructuredData
            data={articleSchema({
              title: blog.title,
              description: blog.description,
              content: blog.content,
              image: blog.featured_image_url || 'https://floridahomefinder.com/default-og-image.jpg',
              author: blog.author_email,
              publishedDate: new Date(blog.published_at || blog.created_at),
              modifiedDate: new Date(blog.updated_at),
              url: `https://floridahomefinder.com/blog/${blog.slug}`
            })}
          />
          <StructuredData
            data={breadcrumbSchema([
              { name: 'Home', url: 'https://floridahomefinder.com' },
              { name: 'Blog', url: 'https://floridahomefinder.com/blog' },
              { name: blog.title, url: `https://floridahomefinder.com/blog/${blog.slug}` }
            ])}
          />
        </>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageWithSidebar sidebar={<BlogPostSidebar />}>
          <BlogDisplay slug={params.slug} onRelatedBlogs={handleRelatedBlogs} />
        </PageWithSidebar>
      </Container>

      {/* Related Articles Section */}
      <Box sx={{ bgcolor: '#f9f9f9', py: 8, mt: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ mb: 4, textAlign: 'center' }}>
            More Articles
          </Typography>
          <Suspense fallback={<CircularProgress sx={{ display: 'block', mx: 'auto' }} />}>
            <BlogListing featured={true} />
          </Suspense>
        </Container>
      </Box>
    </Box>
  )
}
