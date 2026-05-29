'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

// Lazy-load the heavy markdown editor (~9MB raw). Admin-only.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CircularProgress />
    </Box>
  )
})
import { htmlToMarkdown } from '@/utils/htmlToMarkdown'
import APIBlogs from '@/services/API/APIBlogs'

interface ImportData {
  markdown: string
  title: string
  metaDescription: string
  images: string[]
}

export default function BlogImportPage() {
  const router = useRouter()
  const [tabIndex, setTabIndex] = useState(0)
  const [htmlInput, setHtmlInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [importData, setImportData] = useState<ImportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleConvertHtml = useCallback(() => {
    if (!htmlInput.trim()) {
      setError('Please paste some HTML content')
      return
    }
    setError(null)
    setSuccess(null)

    const result = htmlToMarkdown(htmlInput)
    setImportData(result)
  }, [htmlInput])

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch URL')
      }

      const result = htmlToMarkdown(data.html)

      // If no title extracted, try to use URL as fallback
      if (!result.title) {
        try {
          const parsed = new URL(urlInput.trim())
          result.title =
            parsed.pathname
              .split('/')
              .filter(Boolean)
              .pop()
              ?.replace(/-/g, ' ') || 'Imported Post'
        } catch {
          result.title = 'Imported Post'
        }
      }

      setImportData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch URL')
    } finally {
      setLoading(false)
    }
  }, [urlInput])

  const handleImportAsDraft = useCallback(async () => {
    if (!importData) return

    setSaving(true)
    setError(null)

    try {
      const title = importData.title || 'Imported Post'
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const blogData = {
        title,
        slug,
        description: importData.metaDescription || '',
        content: importData.markdown,
        featured_image_url: importData.images[0] || null,
        featured_image_cloudinary_id: null,
        author_email: '',
        status: 'draft' as const,
        tags: ['imported'] as string[],
        categories: [] as string[],
        meta_title: importData.title || null,
        meta_description: importData.metaDescription || null,
        meta_keywords: [] as string[],
        ai_suggested_meta: false,
        ai_suggested_tags: false,
        suggested_tags: null,
        rejected_tags: [] as string[],
        auto_tagged_at: null,
        published_at: null
      }

      const response = await APIBlogs.createBlog(blogData)
      setSuccess('Blog imported as draft successfully!')

      // Redirect to edit page after short delay
      setTimeout(() => {
        router.push(`/admin/blog/${response.blog.id}/edit`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import blog')
    } finally {
      setSaving(false)
    }
  }, [importData, router])

  const handleReset = useCallback(() => {
    setImportData(null)
    setError(null)
    setSuccess(null)
  }, [])

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Typography variant="h3">Import Blog Post</Typography>
          <Button variant="outlined" onClick={() => router.push('/admin/blog')}>
            Back to Blog List
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {!importData ? (
          <Paper sx={{ p: 3 }}>
            <Tabs
              value={tabIndex}
              onChange={(_, value) => setTabIndex(value)}
              sx={{ mb: 3 }}
            >
              <Tab
                label="Paste HTML"
                id="import-tab-0"
                aria-controls="import-tabpanel-0"
              />
              <Tab
                label="Import from URL"
                id="import-tab-1"
                aria-controls="import-tabpanel-1"
              />
            </Tabs>

            {/* Paste HTML Tab */}
            <div
              role="tabpanel"
              hidden={tabIndex !== 0}
              id="import-tabpanel-0"
              aria-labelledby="import-tab-0"
            >
              {tabIndex === 0 && (
                <Stack spacing={3}>
                  <Typography variant="body2" color="text.secondary">
                    Paste the HTML source of a blog post. The converter will
                    extract the content and convert it to markdown.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    label="HTML Content"
                    placeholder="<article>&#10;  <h1>My Blog Post</h1>&#10;  <p>Content here...</p>&#10;</article>"
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    sx={{ fontFamily: 'monospace' }}
                    slotProps={{
                      input: {
                        sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleConvertHtml}
                      disabled={!htmlInput.trim()}
                    >
                      Convert to Markdown
                    </Button>
                  </Box>
                </Stack>
              )}
            </div>

            {/* Import from URL Tab */}
            <div
              role="tabpanel"
              hidden={tabIndex !== 1}
              id="import-tabpanel-1"
              aria-labelledby="import-tab-1"
            >
              {tabIndex === 1 && (
                <Stack spacing={3}>
                  <Typography variant="body2" color="text.secondary">
                    Enter the URL of a blog post to fetch and convert its
                    content to markdown.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Blog Post URL"
                    placeholder="https://example.com/blog/my-post"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchUrl()
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleFetchUrl}
                      disabled={!urlInput.trim() || loading}
                      startIcon={
                        loading ? <CircularProgress size={20} /> : undefined
                      }
                    >
                      {loading ? 'Fetching...' : 'Fetch & Convert'}
                    </Button>
                  </Box>
                </Stack>
              )}
            </div>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {/* Extracted Metadata */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Extracted Metadata
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography>
                    {importData.title || 'No title found'}
                  </Typography>
                </Box>
                {importData.metaDescription && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Meta Description
                    </Typography>
                    <Typography variant="body2">
                      {importData.metaDescription}
                    </Typography>
                  </Box>
                )}
                {importData.images.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Images Found ({importData.images.length})
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: 'wrap' }}
                      useFlexGap
                    >
                      {importData.images.slice(0, 10).map((img, i) => (
                        <Chip
                          key={i}
                          label={
                            img.split('/').pop()?.substring(0, 30) ||
                            `Image ${i + 1}`
                          }
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {importData.images.length > 10 && (
                        <Chip
                          label={`+${importData.images.length - 10} more`}
                          size="small"
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Markdown Preview */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Content Preview
              </Typography>
              <MDEditor
                value={importData.markdown}
                onChange={(value) =>
                  setImportData((prev) =>
                    prev ? { ...prev, markdown: value || '' } : null
                  )
                }
                preview="preview"
                hideToolbar={false}
                height={400}
              />
            </Paper>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleReset}>
                Start Over
              </Button>
              <Button
                variant="contained"
                onClick={handleImportAsDraft}
                disabled={saving || !importData.markdown.trim()}
                startIcon={saving ? <CircularProgress size={20} /> : undefined}
              >
                {saving ? 'Importing...' : 'Import as Draft'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Container>
  )
}
