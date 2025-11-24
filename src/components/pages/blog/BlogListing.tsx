'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Pagination,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  Button
} from '@mui/material'
import type { Blog, BlogTag, BlogCategory } from '@/types/blog'
import APIBlogs from '@/services/API/APIBlogs'

interface BlogListingProps {
  featured?: boolean
}

const BlogListing = ({ featured = false }: BlogListingProps) => {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const itemsPerPage = 9

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (featured) {
          const response = await APIBlogs.getFeaturedBlogs()
          setBlogs(response.blogs)
          setTotalPages(1)
        } else {
          const offset = (page - 1) * itemsPerPage
          const response = await APIBlogs.getBlogs({
            search: search || undefined,
            tag: selectedTag || undefined,
            category: selectedCategory || undefined,
            limit: itemsPerPage,
            offset
          })
          setBlogs(response.blogs)
          setTotalPages(Math.ceil(response.total / itemsPerPage))
        }

        // Fetch tags and categories once
        if (page === 1) {
          const [tagsRes, categoriesRes] = await Promise.all([
            APIBlogs.getTags(),
            APIBlogs.getCategories()
          ])
          setTags(tagsRes.tags)
          setCategories(categoriesRes.categories)
        }
      } catch (error) {
        console.error('Error fetching blogs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, search, selectedTag, selectedCategory, featured])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setSelectedTag('')
    setSelectedCategory('')
    setPage(1)
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        {/* Header */}
        <Typography variant="h1" sx={{ mb: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}>
          {featured ? 'Featured Articles' : 'Blog'}
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          {featured
            ? 'Check out our latest and most popular articles'
            : 'Discover insights and tips about real estate and lifestyle'}
        </Typography>

        {/* Filters */}
        {!featured && (
          <Box sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  variant="outlined"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Select
                  fullWidth
                  displayEmpty
                  value={selectedTag}
                  onChange={e => {
                    setSelectedTag(e.target.value)
                    setPage(1)
                  }}
                  size="small"
                >
                  <MenuItem value="">All Tags</MenuItem>
                  {tags.map(tag => (
                    <MenuItem key={tag.id} value={tag.slug}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Select
                  fullWidth
                  displayEmpty
                  value={selectedCategory}
                  onChange={e => {
                    setSelectedCategory(e.target.value)
                    setPage(1)
                  }}
                  size="small"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.slug}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button fullWidth variant="outlined" onClick={handleReset}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Blog Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : blogs.length === 0 ? (
          <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
            No blogs found. Try adjusting your filters.
          </Typography>
        ) : (
          <>
            <Grid container spacing={4} sx={{ mb: 6 }}>
              {blogs.map(blog => (
                <Grid item xs={12} sm={6} md={4} key={blog.id}>
                  <Link href={`/blog/${blog.slug}`} style={{ textDecoration: 'none' }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        }
                      }}
                    >
                      {blog.featured_image_url && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={blog.featured_image_url}
                          alt={blog.title}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h5" component="div" sx={{ mb: 1 }}>
                          {blog.title}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {blog.description}
                        </Typography>

                        {/* Tags */}
                        {blog.tags.length > 0 && (
                          <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
                            {blog.tags.slice(0, 3).map(tag => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        )}

                        {/* Meta info */}
                        <Typography variant="caption" color="text.secondary">
                          {blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Draft'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Link>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {!featured && totalPages > 1 && (
              <Box display="flex" justifyContent="center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  )
}

export default BlogListing
