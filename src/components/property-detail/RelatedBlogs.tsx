'use client'

import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Link as MuiLink,
  Stack,
  Chip,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material'
import Link from 'next/link'
import ArticleIcon from '@mui/icons-material/Article'
import DateIcon from '@mui/icons-material/CalendarToday'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  imageUrl?: string
  publishedDate?: string
  tags?: string[]
  category?: string
}

interface RelatedBlogsProps {
  posts: BlogPost[]
  city?: string
  state?: string
  propertyType?: string
  maxPosts?: number
}

const RelatedBlogs: React.FC<RelatedBlogsProps> = ({
  posts,
  city,
  state,
  propertyType,
  maxPosts = 3,
}) => {
  if (posts.length === 0) {
    return null
  }

  const displayPosts = posts.slice(0, maxPosts)

  // Build keyword-rich heading
  const buildHeading = () => {
    const parts = ['Related Articles']

    if (city && state) {
      parts.push(`about ${city}, ${state}`)
    }

    if (propertyType) {
      parts.push(`and ${propertyType}s`)
    }

    return parts.join(' ')
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* SEO-optimized H3 heading with keywords */}
      <Typography variant="h6" component="h3" gutterBottom>
        {buildHeading()}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Discover helpful insights and local market information
      </Typography>

      <Stack spacing={2}>
        {displayPosts.map((post) => (
          <Card
            key={post.id}
            elevation={0}
            sx={{
              display: 'flex',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
              transition: 'all 0.2s',
            }}
          >
            {/* Blog Post Image */}
            {post.imageUrl && (
              <CardMedia
                component="img"
                sx={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  display: { xs: 'none', sm: 'block' },
                }}
                image={post.imageUrl}
                alt={post.title}
              />
            )}

            {/* Blog Post Content */}
            <CardContent sx={{ flex: 1, py: 2 }}>
              <Link href={`/blog/${post.slug}`} passHref legacyBehavior>
                <MuiLink
                  underline="hover"
                  sx={{
                    '&:hover h6': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    component="h4"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {post.title}
                  </Typography>
                </MuiLink>
              </Link>

              {/* Excerpt */}
              {post.excerpt && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.excerpt}
                </Typography>
              )}

              {/* Meta information */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                {post.publishedDate && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <DateIcon sx={{ fontSize: 14 }} color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.publishedDate)}
                    </Typography>
                  </Stack>
                )}

                {post.category && (
                  <Chip label={post.category} size="small" />
                )}

                {post.tags && post.tags.length > 0 && (
                  <>
                    {post.tags.slice(0, 2).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Footer link to all blog posts */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Link href="/blog" passHref legacyBehavior>
          <MuiLink
            variant="body2"
            fontWeight="medium"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <ArticleIcon fontSize="small" />
            View all articles →
          </MuiLink>
        </Link>
      </Box>
    </Paper>
  )
}

export default RelatedBlogs
