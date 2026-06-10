'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import AddIcon from '@mui/icons-material/Add'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PublishIcon from '@mui/icons-material/Publish'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'

import APIContentPages, {
  type ContentPage
} from '@/services/API/APIContentPages'

const STATUS_COLORS: Record<
  string,
  'default' | 'primary' | 'success' | 'warning'
> = {
  draft: 'default',
  published: 'success',
  scheduled: 'warning'
}

export default function ContentPagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [templateFilter, setTemplateFilter] = useState<string>('')

  useEffect(() => {
    fetchPages()
  }, [statusFilter, templateFilter])

  const fetchPages = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: any = {}
      if (statusFilter) filters.status = statusFilter
      if (templateFilter === 'templates') filters.is_template = true
      if (templateFilter === 'pages') filters.is_template = false

      const response = await APIContentPages.getPages(filters)
      setPages(response.pages)
    } catch (err: any) {
      setError(err?.message || 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishPage = async (id: string) => {
    try {
      await APIContentPages.publishPage(id)
      // Refresh the sitemap cache so the newly-published page appears
      // in /sitemaps/pages.xml within seconds. Best-effort — don't block
      // the publish UX on this.
      try {
        await fetch('/api/revalidate?tag=sitemap-pages', { method: 'POST' })
      } catch (e) {
        console.error('Failed to revalidate sitemap-pages tag', e)
      }
      fetchPages()
    } catch (err: any) {
      alert('Failed to publish page')
    }
  }

  const handleDeletePage = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await APIContentPages.deletePage(id)
      fetchPages()
    } catch (err: any) {
      alert('Failed to delete page')
    }
  }

  const handleDuplicatePage = async (id: string, title: string) => {
    const newTitle = prompt('Enter title for the new page:', `${title} (Copy)`)
    if (!newTitle) return

    try {
      await APIContentPages.duplicateFromTemplate(id, newTitle)
      fetchPages()
    } catch (err: any) {
      alert('Failed to duplicate page')
    }
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1">
            Content Pages
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.push('/admin/content-pages/templates')}
            >
              Templates
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/content-pages/new')}
            >
              Create Page
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={templateFilter}
                label="Type"
                onChange={(e) => setTemplateFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pages">Pages</MenuItem>
                <MenuItem value="templates">Templates</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No pages found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((page) => (
                    <TableRow key={page.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {page.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          /{page.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={page.status.toUpperCase()}
                          size="small"
                          color={STATUS_COLORS[page.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {page.is_template ? (
                          <Chip
                            label="Template"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Page"
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(page.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/admin/content-pages/${page.id}`)
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDuplicatePage(page.id, page.title)
                          }
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                        {page.status === 'draft' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handlePublishPage(page.id)}
                          >
                            <PublishIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePage(page.id, page.title)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </Container>
  )
}
