'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper
} from '@mui/material'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import type { Blog, AISuggestions } from '@/types/blog'
import APIBlogs from '@/services/API/APIBlogs'

interface BlogEditorProps {
  blogId?: number
  onSave?: (blog: Blog) => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const BlogEditor = ({ blogId, onSave }: BlogEditorProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(!!blogId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: [] as string[],
    tags: [] as string[],
    categories: [] as string[],
    featured_image_url: '',
    status: 'draft' as const
  })

  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)

  // Load existing blog if editing
  useEffect(() => {
    if (blogId) {
      const loadBlog = async () => {
        try {
          const response = await APIBlogs.getAdminBlog(blogId)
          const blog = response.blog

          setFormData({
            title: blog.title,
            description: blog.description,
            content: blog.content,
            meta_title: blog.meta_title || '',
            meta_description: blog.meta_description || '',
            meta_keywords: blog.meta_keywords,
            tags: blog.tags,
            categories: blog.categories,
            featured_image_url: blog.featured_image_url || '',
            status: blog.status
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load blog')
        } finally {
          setLoading(false)
        }
      }

      loadBlog()
    }
  }, [blogId])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddKeyword = (keyword: string) => {
    if (keyword && !formData.meta_keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        meta_keywords: [...prev.meta_keywords, keyword]
      }))
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      meta_keywords: prev.meta_keywords.filter(k => k !== keyword)
    }))
  }

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleGenerateAISuggestions = async () => {
    if (!formData.title || !formData.description || !formData.content) {
      setError('Please fill in title, description, and content first')
      return
    }

    try {
      setLoadingAI(true)
      const response = await APIBlogs.generateAISuggestions(
        formData.title,
        formData.description,
        formData.content
      )

      setAiSuggestions(response.suggestions)
      setShowAISuggestions(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI suggestions')
    } finally {
      setLoadingAI(false)
    }
  }

  const handleApplyAISuggestions = () => {
    if (aiSuggestions) {
      setFormData(prev => ({
        ...prev,
        meta_title: aiSuggestions.meta_title,
        meta_description: aiSuggestions.meta_description,
        meta_keywords: aiSuggestions.meta_keywords,
        tags: [...new Set([...prev.tags, ...aiSuggestions.tags])]
      }))
      setShowAISuggestions(false)
    }
  }

  const handleSaveDraft = async () => {
    await handleSave('draft')
  }

  const handlePublish = async () => {
    await handleSave('published')
  }

  const handleSave = async (status: 'draft' | 'published') => {
    try {
      setSaving(true)
      setError(null)

      const blogData = {
        ...formData,
        status
      }

      let savedBlog: Blog

      if (blogId) {
        const response = await APIBlogs.updateBlog(blogId, blogData)
        savedBlog = response.blog
      } else {
        const response = await APIBlogs.createBlog(blogData)
        savedBlog = response.blog
      }

      if (onSave) {
        onSave(savedBlog)
      } else {
        // Redirect to blog view
        router.push(`/blog/${savedBlog.slug}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" sx={{ mb: 4 }}>
          {blogId ? 'Edit Blog' : 'Create New Blog'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Stack spacing={3}>
          {/* Title */}
          <TextField
            fullWidth
            label="Blog Title"
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            inputProps={{ maxLength: 200 }}
            helperText={`${formData.title.length}/200`}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description (Excerpt)"
            multiline
            rows={3}
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${formData.description.length}/500`}
          />

          {/* Markdown Editor */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Content
            </Typography>
            <Paper variant="outlined">
              <MDEditor
                value={formData.content}
                onChange={value => handleInputChange('content', value || '')}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={true}
                height={400}
                textareaProps={{
                  disabled: false
                }}
                className="mdeditor"
              />
            </Paper>
          </Box>

          {/* Featured Image URL */}
          <TextField
            fullWidth
            label="Featured Image URL (Cloudinary)"
            value={formData.featured_image_url}
            onChange={e => handleInputChange('featured_image_url', e.target.value)}
            helperText="Paste Cloudinary image URL here"
          />

          {/* SEO Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">SEO Settings</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleGenerateAISuggestions}
                disabled={loadingAI}
              >
                {loadingAI ? 'Generating...' : 'Generate with AI'}
              </Button>
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Meta Title"
                value={formData.meta_title}
                onChange={e => handleInputChange('meta_title', e.target.value)}
                inputProps={{ maxLength: 60 }}
                helperText={`${formData.meta_title.length}/60 - Appears in search results`}
              />

              <TextField
                fullWidth
                label="Meta Description"
                multiline
                rows={2}
                value={formData.meta_description}
                onChange={e => handleInputChange('meta_description', e.target.value)}
                inputProps={{ maxLength: 160 }}
                helperText={`${formData.meta_description.length}/160 - Appears in search results`}
              />

              {/* Keywords */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Keywords
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Type a keyword and press Enter"
                  size="small"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddKeyword((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }} useFlexGap>
                  {formData.meta_keywords.map(keyword => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      onDelete={() => handleRemoveKeyword(keyword)}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Tags & Categories */}
          <Box>
            <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
              <Tab label="Tags" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Categories" id="tab-1" aria-controls="tabpanel-1" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <TextField
                fullWidth
                placeholder="Add a tag and press Enter"
                size="small"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddTag((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }} useFlexGap>
                {formData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                  />
                ))}
              </Stack>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TextField
                fullWidth
                placeholder="Add a category and press Enter"
                size="small"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleInputChange('categories', [
                      ...formData.categories,
                      (e.target as HTMLInputElement).value
                    ])
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }} useFlexGap>
                {formData.categories.map(cat => (
                  <Chip
                    key={cat}
                    label={cat}
                    onDelete={() =>
                      handleInputChange(
                        'categories',
                        formData.categories.filter(c => c !== cat)
                      )
                    }
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </TabPanel>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={saving}
            >
              {saving ? 'Publishing...' : 'Publish'}
            </Button>
          </Stack>
        </Stack>

        {/* AI Suggestions Dialog */}
        <Dialog open={showAISuggestions} onClose={() => setShowAISuggestions(false)} maxWidth="sm" fullWidth>
          <DialogTitle>AI-Generated Suggestions</DialogTitle>
          <DialogContent>
            {aiSuggestions && (
              <Stack spacing={2} sx={{ pt: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Meta Title
                  </Typography>
                  <Typography variant="body2">{aiSuggestions.meta_title}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Meta Description
                  </Typography>
                  <Typography variant="body2">{aiSuggestions.meta_description}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Keywords
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                    {aiSuggestions.meta_keywords.map(kw => (
                      <Chip key={kw} label={kw} size="small" />
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Suggested Tags
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                    {aiSuggestions.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" color="primary" />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAISuggestions(false)}>Cancel</Button>
            <Button onClick={handleApplyAISuggestions} variant="contained">
              Apply Suggestions
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default BlogEditor
