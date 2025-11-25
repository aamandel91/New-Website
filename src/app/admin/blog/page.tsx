'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import type { Blog } from '@/types/blog'
import APIBlogs from '@/services/API/APIBlogs'

export default function AdminBlogPage() {
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; blogId?: number }>({ open: false })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        const response = await APIBlogs.getAdminBlogs({ limit: 50 })
        setBlogs(response.blogs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blogs')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  const handleDelete = async () => {
    if (!deleteDialog.blogId) return

    try {
      setDeleting(true)
      await APIBlogs.deleteBlog(deleteDialog.blogId)

      // Remove from list
      setBlogs(blogs.filter(b => b.id !== deleteDialog.blogId))
      setDeleteDialog({ open: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog')
    } finally {
      setDeleting(false)
    }
  }

  const handlePublish = async (blogId: number) => {
    try {
      await APIBlogs.publishBlog(blogId)

      // Update blog status
      setBlogs(blogs.map(b => (b.id === blogId ? { ...b, status: 'published', published_at: new Date() } : b)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish blog')
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h3">Blog Management</Typography>
          <Link href="/admin/blog/new" style={{ textDecoration: 'none' }}>
            <Button variant="contained">Create New Blog</Button>
          </Link>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : blogs.length === 0 ? (
          <Alert severity="info">No blogs yet. Create your first blog post!</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Published</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blogs.map(blog => (
                  <TableRow key={blog.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{blog.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        /{blog.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={blog.status}
                        color={blog.status === 'published' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {blog.published_at
                        ? new Date(blog.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Not published'}
                    </TableCell>
                    <TableCell>
                      {blog.tags.slice(0, 2).map(tag => (
                        <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                      ))}
                      {blog.tags.length > 2 && (
                        <Chip label={`+${blog.tags.length - 2}`} size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Link href={`/admin/blog/${blog.id}/edit`} style={{ textDecoration: 'none' }}>
                          <Button size="small" variant="outlined">
                            Edit
                          </Button>
                        </Link>
                        {blog.status === 'draft' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => handlePublish(blog.id)}
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, blogId: blog.id })}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
          <DialogTitle>Delete Blog?</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this blog post? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}
