'use client'

import React, { useEffect, useState } from 'react'

import { Box, Button, Skeleton, Typography } from '@mui/material'

import type { Blog } from '@/types/blog'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

interface RecentBlogsProps {
  city?: string
  limit?: number
}

export default function RecentBlogs({ city, limit = 3 }: RecentBlogsProps) {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchBlogs() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const params = new URLSearchParams({
          limit: String(limit + 5),
          status: 'published'
        })
        const res = await fetch(`${apiUrl}/api/blogs?${params}`)
        if (!res.ok) throw new Error('Failed to fetch blogs')
        const data = await res.json()
        let posts: Blog[] = data.blogs || []

        if (city) {
          const cityLower = city.toLowerCase()
          const filtered = posts.filter(
            (b) =>
              b.title.toLowerCase().includes(cityLower) ||
              (b.tags &&
                b.tags.some((t) => t.toLowerCase().includes(cityLower)))
          )
          posts = filtered.length > 0 ? filtered : posts
        }

        if (!cancelled) setBlogs(posts.slice(0, limit))
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBlogs()
    return () => {
      cancelled = true
    }
  }, [city, limit])

  if (loading) {
    return (
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 1.5, color: NAVY }}
        >
          Recent Blog Posts
        </Typography>
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={60}
            sx={{ borderRadius: 1, mb: 1 }}
          />
        ))}
      </Box>
    )
  }

  if (blogs.length === 0) {
    return (
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 1, color: NAVY }}
        >
          Recent Blog Posts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No blog posts yet
        </Typography>
      </Box>
    )
  }

  const viewAllHref = city
    ? `/blog/tag/${city.toLowerCase().replace(/\s+/g, '-')}`
    : '/blog'

  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1.5, color: NAVY }}
      >
        Recent Blog Posts
      </Typography>
      {blogs.map((blog) => (
        <Box
          key={blog.id}
          component="a"
          href={`/blog/${blog.slug}`}
          sx={{
            display: 'flex',
            gap: 1.5,
            mb: 1.5,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover .blog-title': { color: 'primary.main' }
          }}
        >
          {blog.featured_image_url && (
            <Box
              component="img"
              src={blog.featured_image_url}
              alt={blog.title}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              className="blog-title"
              variant="body2"
              fontWeight={600}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3,
                transition: 'color 0.2s'
              }}
            >
              {blog.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(
                blog.published_at || blog.created_at
              ).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
          </Box>
        </Box>
      ))}
      <Button
        variant="outlined"
        fullWidth
        href={viewAllHref}
        size="small"
        sx={{
          mt: 0.5,
          borderColor: GOLD,
          color: NAVY,
          fontWeight: 600,
          fontSize: '0.75rem',
          '&:hover': {
            bgcolor: 'rgba(196,169,110,0.08)',
            borderColor: '#a8903e'
          }
        }}
      >
        VIEW ALL BLOG POSTS
      </Button>
    </Box>
  )
}
