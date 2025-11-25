'use client'

import { useEffect, useState } from 'react'
import { Box, Container, Typography, Chip, Stack, CircularProgress, Alert } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import type { Blog } from '@/types/blog'
import APIBlogs from '@/services/API/APIBlogs'

interface BlogDisplayProps {
  slug: string
  onRelatedBlogs?: (blogs: Blog[]) => void
}

const BlogDisplay = ({ slug, onRelatedBlogs }: BlogDisplayProps) => {
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        const response = await APIBlogs.getBlogBySlug(slug)
        setBlog(response.blog)

        if (response.related && onRelatedBlogs) {
          onRelatedBlogs(response.related)
        }

        // Set page title and meta tags for SEO
        document.title = response.blog.meta_title || response.blog.title
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
          metaDescription.setAttribute('content', response.blog.meta_description || response.blog.description)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog')
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [slug, onRelatedBlogs])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!blog) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning">Blog not found</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              mb: 2,
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {blog.title}
          </Typography>

          <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
            {blog.description}
          </Typography>

          {/* Meta info */}
          <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }} useFlexGap>
            <Typography variant="body2" color="text.secondary">
              By {blog.author_email}
            </Typography>
            {blog.published_at && (
              <Typography variant="body2" color="text.secondary">
                {new Date(blog.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            )}
          </Stack>

          {/* Tags */}
          {blog.tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
              {blog.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="outlined"
                  size="small"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    // Could navigate to tag page here
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Featured Image */}
        {blog.featured_image_url && (
          <Box
            component="img"
            src={blog.featured_image_url}
            alt={blog.title}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 2,
              mb: 4,
              maxHeight: '500px',
              objectFit: 'cover'
            }}
          />
        )}

        {/* Content */}
        <Box
          sx={{
            '& h1': {
              fontSize: '2rem',
              mt: 4,
              mb: 2,
              fontWeight: 600
            },
            '& h2': {
              fontSize: '1.5rem',
              mt: 3,
              mb: 1.5,
              fontWeight: 600
            },
            '& h3': {
              fontSize: '1.25rem',
              mt: 2.5,
              mb: 1,
              fontWeight: 600
            },
            '& p': {
              lineHeight: 1.8,
              mb: 2,
              color: 'text.primary'
            },
            '& ul, & ol': {
              ml: 2,
              mb: 2
            },
            '& li': {
              mb: 1,
              color: 'text.primary'
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'underline'
              }
            },
            '& pre': {
              background: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              mb: 2
            },
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            },
            '& blockquote': {
              borderLeft: '4px solid primary.main',
              pl: 2,
              py: 1,
              my: 2,
              fontStyle: 'italic',
              color: 'text.secondary'
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1,
              my: 2
            }
          }}
        >
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </Box>

        {/* Categories */}
        {blog.categories.length > 0 && (
          <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Categories
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
              {blog.categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default BlogDisplay
