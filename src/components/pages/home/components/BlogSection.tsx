'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Box, Button, Typography } from '@mui/material'
import type { Blog } from '@/types/blog'

const PLACEHOLDER_ARTICLES = [
  {
    title: 'Cost of Living in Pembroke Pines FL (2026)',
    category: 'Moving To & Living In Guides',
    author: 'Andy Mandel',
    date: 'March 31, 2026',
    slug: '',
    thumbnail: '',
  },
  {
    title: 'Buying a Home with an HOA in Florida (2026)',
    category: 'Home Buying',
    author: 'Andy Mandel',
    date: 'March 31, 2026',
    slug: '',
    thumbnail: '',
  },
  {
    title: 'Cost of Living in Cooper City FL (2026)',
    category: 'Moving To & Living In Guides',
    author: 'Andy Mandel',
    date: 'March 30, 2026',
    slug: '',
    thumbnail: '',
  },
]

interface ArticleDisplay {
  title: string
  category: string
  author: string
  date: string
  slug: string
  thumbnail: string
}

function blogToArticle(blog: Blog): ArticleDisplay {
  return {
    title: blog.title,
    category: blog.categories?.[0] || 'Blog',
    author: blog.author_email?.split('@')[0] || 'Andy Mandel',
    date: blog.published_at
      ? new Date(blog.published_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '',
    slug: blog.slug,
    thumbnail: blog.featured_image_url || '',
  }
}

const BlogSection = () => {
  const [articles, setArticles] = useState<ArticleDisplay[]>(PLACEHOLDER_ARTICLES)

  useEffect(() => {
    fetch('/api/blogs?limit=3&status=published')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        const blogs: Blog[] = data.blogs || []
        if (blogs.length > 0) {
          setArticles(blogs.map(blogToArticle))
        }
      })
      .catch(() => {
        // Keep placeholder articles on error
      })
  }, [])

  return (
    <Box sx={{ bgcolor: '#2C2C2C', py: { xs: 6, md: 10 }, px: { xs: 3, md: 6 } }}>
      <Box
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 6 },
        }}
      >
        {/* Left Column */}
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: '60px', md: '120px' },
              fontWeight: 100,
              color: '#555',
              lineHeight: 1,
              mb: 3,
              textTransform: 'uppercase',
            }}
          >
            Florida Home Finder
          </Typography>
          <Box sx={{ width: '60px', height: '3px', bgcolor: '#00B5AD', mb: 3 }} />
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '14px',
              lineHeight: 1.8,
              mb: 4,
            }}
          >
            Catch up on the latest South Florida real estate news, tips, local insights and advice on
            a variety of home-related topics. Educated buyers and sellers typically make smarter
            decisions when it comes to real estate. We strive to keep you informed on the latest South
            Florida real estate news.
          </Typography>
          <Link href="/blog" style={{ textDecoration: 'none' }}>
            <Button
              variant="outlined"
              sx={{
                color: '#fff',
                borderColor: '#fff',
                fontSize: '12px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                px: 4,
                py: 1.5,
                borderRadius: '30px',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Read More
            </Button>
          </Link>
        </Box>

        {/* Right Column — Article Cards */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {articles.map((article) => {
            const Wrapper = article.slug
              ? ({ children }: { children: React.ReactNode }) => (
                  <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
                    {children}
                  </Link>
                )
              : ({ children }: { children: React.ReactNode }) => <>{children}</>

            return (
              <Wrapper key={article.title}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: '6px',
                    display: 'flex',
                    overflow: 'hidden',
                    minHeight: '120px',
                    cursor: article.slug ? 'pointer' : 'default',
                    transition: 'transform 0.2s',
                    '&:hover': article.slug ? { transform: 'translateY(-2px)' } : {},
                  }}
                >
                  {/* Thumbnail */}
                  <Box
                    sx={{
                      width: '140px',
                      minWidth: '140px',
                      background: article.thumbnail
                        ? `url(${article.thumbnail}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                  {/* Content */}
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#00B5AD',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        mb: 0.5,
                      }}
                    >
                      {article.category}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#333',
                        fontSize: '15px',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        mb: 1,
                      }}
                    >
                      {article.title}
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '12px' }}>
                      BY {article.author} &middot; {article.date}
                    </Typography>
                  </Box>
                </Box>
              </Wrapper>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

export default BlogSection
