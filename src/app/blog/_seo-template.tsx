/**
 * BLOG POST PAGE - SEO IMPLEMENTATION TEMPLATE
 *
 * Apply this pattern to: /src/app/blog/[slug]/page.tsx
 *
 * This template shows how to:
 * - Generate dynamic metadata for blog posts
 * - Add JSON-LD articleSchema for rich snippets
 * - Create breadcrumbs for blog posts
 * - Optimize for social sharing
 * - Handle canonical URLs
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import StructuredData from '@shared/StructuredData'
import { articleSchema, breadcrumbSchema } from 'utils/structuredData'

/**
 * Example blog post interface - adapt to your data structure
 */
interface BlogPost {
  id: number
  slug: string
  title: string
  description: string
  content: string
  featured_image_url: string | null
  author_email: string
  author_name: string
  tags: string[]
  published_at: Date
  updated_at: Date
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[]
}

/**
 * Generate dynamic metadata for each blog post
 */
export async function generateMetadata(props: {
  params: { slug: string }
}): Promise<Metadata> {
  // TODO: Fetch blog post from your API
  // const post = await fetchBlogBySlug(params.slug)

  // Example blog post for template
  const post: BlogPost = {
    id: 1,
    slug: 'best-neighborhoods-miami-2024',
    title: 'The Best Neighborhoods in Miami for Homebuyers in 2024',
    description: 'Discover the top neighborhoods in Miami, their characteristics, amenities, and why they\'re great for homebuyers.',
    content: 'Comprehensive content about Miami neighborhoods...',
    featured_image_url: 'https://floridahomefinder.com/blog-image.jpg',
    author_email: 'author@floridahomefinder.com',
    author_name: 'Sarah Johnson',
    tags: ['Miami', 'neighborhoods', 'homebuying', 'real estate'],
    published_at: new Date('2024-11-20'),
    updated_at: new Date('2024-11-24'),
    meta_title: 'Best Miami Neighborhoods 2024 | Florida Home Finder',
    meta_description: 'Explore top Miami neighborhoods perfect for homebuyers in 2024. Find the best areas with great schools, amenities, and value.',
    meta_keywords: ['Miami neighborhoods', 'best places to live Miami', 'Miami real estate', '2024']
  }

  if (!post) {
    return {
      title: 'Blog Post | Florida Home Finder',
      robots: { index: false }
    }
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.description,
    keywords: post.meta_keywords && post.meta_keywords.length > 0 ? post.meta_keywords : post.tags,
    alternates: {
      canonical: `https://floridahomefinder.com/blog/${post.slug}`
    },
    openGraph: {
      type: 'article',
      publishedTime: post.published_at.toISOString(),
      modifiedTime: post.updated_at.toISOString(),
      authors: [post.author_name],
      tags: post.tags,
      title: post.title,
      description: post.description,
      url: `https://floridahomefinder.com/blog/${post.slug}`,
      siteName: 'Florida Home Finder',
      ...(post.featured_image_url && {
        images: [
          {
            url: post.featured_image_url,
            width: 1200,
            height: 630,
            alt: post.title,
            type: 'image/jpeg'
          }
        ]
      })
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      ...(post.featured_image_url && {
        images: [post.featured_image_url]
      }),
      creator: '@FloridaHomeFinder'
    }
  }
}

/**
 * Example blog post component
 */
export default function BlogPostPage(props: { params: { slug: string } }) {
  // TODO: Fetch actual blog post from your API
  const post: BlogPost = {
    id: 1,
    slug: 'best-neighborhoods-miami-2024',
    title: 'The Best Neighborhoods in Miami for Homebuyers in 2024',
    description: 'Discover the top neighborhoods in Miami, their characteristics, amenities, and why they\'re great for homebuyers.',
    content: 'Comprehensive content about Miami neighborhoods...',
    featured_image_url: 'https://floridahomefinder.com/blog-image.jpg',
    author_email: 'author@floridahomefinder.com',
    author_name: 'Sarah Johnson',
    tags: ['Miami', 'neighborhoods', 'homebuying', 'real estate'],
    published_at: new Date('2024-11-20'),
    updated_at: new Date('2024-11-24'),
    meta_title: 'Best Miami Neighborhoods 2024 | Florida Home Finder',
    meta_description: 'Explore top Miami neighborhoods perfect for homebuyers in 2024. Find the best areas with great schools, amenities, and value.',
    meta_keywords: ['Miami neighborhoods', 'best places to live Miami', 'Miami real estate', '2024']
  }

  // Generate article schema for rich snippets
  const articleStructuredData = articleSchema({
    title: post.title,
    description: post.description,
    content: post.content,
    image: post.featured_image_url || 'https://floridahomefinder.com/default-og-image.jpg',
    author: post.author_name,
    publishedDate: post.published_at,
    modifiedDate: post.updated_at,
    url: `https://floridahomefinder.com/blog/${post.slug}`
  })

  // Generate breadcrumb schema
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: 'https://floridahomefinder.com' },
    { name: 'Blog', url: 'https://floridahomefinder.com/blog' },
    { name: post.title, url: `https://floridahomefinder.com/blog/${post.slug}` }
  ])

  return (
    <>
      {/* Inject structured data */}
      <StructuredData data={articleStructuredData} />
      <StructuredData data={breadcrumbs} />

      {/* Your blog post content */}
      <article className="blog-post">
        <header>
          <h1>{post.title}</h1>
          <p className="subtitle">{post.description}</p>
          <div className="meta">
            <span>By {post.author_name}</span>
            <span>{post.published_at.toLocaleDateString()}</span>
            {post.updated_at && post.updated_at > post.published_at && (
              <span>Updated: {post.updated_at.toLocaleDateString()}</span>
            )}
          </div>
        </header>

        {post.featured_image_url && (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            width={1200}
            height={630}
            className="featured-image"
            style={{ width: '100%', height: 'auto' }}
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        )}

        <div className="content">{post.content}</div>

        <footer>
          {post.tags && post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map(tag => (
                <a key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="tag">
                  {tag}
                </a>
              ))}
            </div>
          )}
        </footer>
      </article>
    </>
  )
}

/**
 * Generate static params for pre-rendering popular blog posts
 * Uncomment and implement when ready:
 */
// export async function generateStaticParams() {
//   // TODO: Fetch recent/popular blog posts
//   const posts = await fetchRecentBlogPosts(50)
//
//   return posts.map(post => ({
//     slug: post.slug
//   }))
// }
