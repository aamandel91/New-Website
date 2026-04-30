import { Suspense } from 'react'
import { Box, Container, Typography, CircularProgress } from '@mui/material'
import type { Metadata } from 'next'
import { BlogDisplay, BlogListing } from '@pages/blog'
import StructuredData from '@shared/StructuredData'
import PageWithSidebar from '@/components/layouts/PageWithSidebar'
import BlogPostSidebar from '@/components/sidebar/BlogPostSidebar'
import { articleSchema, breadcrumbSchema } from 'utils/structuredData'
import { tenant } from '@/configs/tenant.config'
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

  const baseUrl = tenant.brand.siteUrl

  if (!blog) {
    return {
      title: `Blog Post | ${tenant.brand.siteName}`,
      description: 'Read our latest blog post about real estate and lifestyle',
      robots: { index: false }
    }
  }

  const authorDisplay = blog.author_email || tenant.brand.leaderName

  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.description,
    keywords: blog.meta_keywords && blog.meta_keywords.length > 0 ? blog.meta_keywords : blog.tags,
    alternates: {
      canonical: `${baseUrl}/blog/${blog.slug}`
    },
    openGraph: {
      type: 'article',
      publishedTime: blog.published_at ? new Date(blog.published_at).toISOString() : undefined,
      modifiedTime: new Date(blog.updated_at).toISOString(),
      authors: [authorDisplay],
      tags: blog.tags,
      title: blog.title,
      description: blog.description,
      url: `${baseUrl}/blog/${blog.slug}`,
      siteName: tenant.brand.siteName,
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
      })
    }
  }
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const params = await props.params
  const blog = await fetchBlogServer(params.slug)
  const baseUrl = tenant.brand.siteUrl

  return (
    <Box>
      {blog && (
        <>
          <StructuredData
            data={articleSchema({
              title: blog.title,
              description: blog.description,
              content: blog.content,
              image: blog.featured_image_url || `${baseUrl}/default-og-image.jpg`,
              author: blog.author_email || tenant.brand.leaderName,
              publishedDate: new Date(blog.published_at || blog.created_at),
              modifiedDate: new Date(blog.updated_at),
              url: `${baseUrl}/blog/${blog.slug}`
            })}
          />
          <StructuredData
            data={breadcrumbSchema([
              { name: 'Home', url: baseUrl },
              { name: 'Blog', url: `${baseUrl}/blog` },
              { name: blog.title, url: `${baseUrl}/blog/${blog.slug}` }
            ])}
          />
        </>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageWithSidebar sidebar={<BlogPostSidebar />}>
          <BlogDisplay slug={params.slug} />
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
