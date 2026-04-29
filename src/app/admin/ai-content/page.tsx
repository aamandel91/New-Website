'use client'

import React, { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid
} from '@mui/material'
import AIIcon from '@mui/icons-material/AutoAwesome'
import ArticleIcon from '@mui/icons-material/Article'
import SearchIcon from '@mui/icons-material/Search'
import QueueIcon from '@mui/icons-material/Queue'
import APIAIContent, {
  type AIBlogPostResponse,
  type AIKeywordSuggestion
} from '@/services/API/APIAIContent'
import { useRouter } from 'next/navigation'
import KeywordQueueTab from './components/KeywordQueueTab'

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AIContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Blog Generation
  const [blogKeyword, setBlogKeyword] = useState('')
  const [blogCity, setBlogCity] = useState('')
  const [blogTone, setBlogTone] = useState('professional')
  const [blogLength, setBlogLength] = useState(800)
  const [generatedBlog, setGeneratedBlog] = useState<AIBlogPostResponse | null>(null)

  // Keyword Research
  const [keywordTopic, setKeywordTopic] = useState('')
  const [keywordCity, setKeywordCity] = useState('')
  const [suggestedKeywords, setSuggestedKeywords] = useState<AIKeywordSuggestion[]>([])

  const handleGenerateBlog = async () => {
    if (!blogKeyword) {
      setError('Please enter a keyword')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setGeneratedBlog(null)

      const result = await APIAIContent.generateBlogPost({
        keyword: blogKeyword,
        city: blogCity || undefined,
        tone: blogTone,
        length: blogLength
      })

      setGeneratedBlog(result)
    } catch (err: any) {
      setError(err?.message || 'Failed to generate blog post')
    } finally {
      setLoading(false)
    }
  }

  const handleKeywordResearch = async () => {
    if (!keywordTopic) {
      setError('Please enter a topic')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuggestedKeywords([])

      const keywords = await APIAIContent.suggestKeywords(
        keywordTopic,
        keywordCity || undefined
      )

      setSuggestedKeywords(keywords)
    } catch (err: any) {
      setError(err?.message || 'Failed to suggest keywords')
    } finally {
      setLoading(false)
    }
  }

  const handleUseBlogPost = () => {
    if (!generatedBlog) return
    // Navigate to create blog page with pre-filled data
    const params = new URLSearchParams({
      title: generatedBlog.title,
      content: generatedBlog.content,
      excerpt: generatedBlog.excerpt,
      metaTitle: generatedBlog.meta_title,
      metaDescription: generatedBlog.meta_description,
      tags: generatedBlog.tags.join(',')
    })
    router.push(`/admin/blogs/new?${params.toString()}`)
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Content Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Generate SEO-optimized content using AI
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<ArticleIcon />} label="Generate Blog Post" iconPosition="start" />
            <Tab icon={<SearchIcon />} label="Keyword Research" iconPosition="start" />
            <Tab icon={<QueueIcon />} label="Keyword Queue" iconPosition="start" />
          </Tabs>

          {/* Blog Generation Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <TextField
                    label="Target Keyword"
                    fullWidth
                    value={blogKeyword}
                    onChange={(e) => setBlogKeyword(e.target.value)}
                    placeholder="e.g., buying a home in Miami"
                    required
                  />

                  <TextField
                    label="City (Optional)"
                    fullWidth
                    value={blogCity}
                    onChange={(e) => setBlogCity(e.target.value)}
                    placeholder="e.g., Miami"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Tone</InputLabel>
                    <Select value={blogTone} label="Tone" onChange={(e) => setBlogTone(e.target.value)}>
                      <MenuItem value="professional">Professional</MenuItem>
                      <MenuItem value="casual">Casual</MenuItem>
                      <MenuItem value="friendly">Friendly</MenuItem>
                      <MenuItem value="authoritative">Authoritative</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Length</InputLabel>
                    <Select
                      value={blogLength}
                      label="Length"
                      onChange={(e) => setBlogLength(Number(e.target.value))}
                    >
                      <MenuItem value={500}>Short (~500 words)</MenuItem>
                      <MenuItem value={800}>Medium (~800 words)</MenuItem>
                      <MenuItem value={1200}>Long (~1200 words)</MenuItem>
                      <MenuItem value={2000}>Very Long (~2000 words)</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
                    onClick={handleGenerateBlog}
                    disabled={loading || !blogKeyword}
                    fullWidth
                  >
                    {loading ? 'Generating...' : 'Generate Blog Post'}
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                {generatedBlog ? (
                  <Card>
                    <CardContent>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="h5" gutterBottom>
                            {generatedBlog.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {generatedBlog.excerpt}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Meta Title
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {generatedBlog.meta_title}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Meta Description
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {generatedBlog.meta_description}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Tags
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {generatedBlog.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" />
                            ))}
                          </Stack>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Content Preview
                          </Typography>
                          <Paper
                            sx={{
                              p: 2,
                              maxHeight: 300,
                              overflow: 'auto',
                              bgcolor: 'grey.50'
                            }}
                          >
                            <div dangerouslySetInnerHTML={{ __html: generatedBlog.content }} />
                          </Paper>
                        </Box>

                        <Button variant="contained" onClick={handleUseBlogPost} fullWidth>
                          Use This Blog Post
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 400,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'grey.50'
                    }}
                  >
                    <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Generated content will appear here
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Keyword Research Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <TextField
                    label="Topic"
                    fullWidth
                    value={keywordTopic}
                    onChange={(e) => setKeywordTopic(e.target.value)}
                    placeholder="e.g., real estate"
                    required
                  />

                  <TextField
                    label="City (Optional)"
                    fullWidth
                    value={keywordCity}
                    onChange={(e) => setKeywordCity(e.target.value)}
                    placeholder="e.g., Miami"
                  />

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                    onClick={handleKeywordResearch}
                    disabled={loading || !keywordTopic}
                    fullWidth
                  >
                    {loading ? 'Researching...' : 'Research Keywords'}
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                {suggestedKeywords.length > 0 ? (
                  <Stack spacing={2}>
                    {suggestedKeywords.map((keyword, index) => (
                      <Card key={index}>
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {keyword.keyword}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {keyword.intent}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sm={2}>
                              <Typography variant="caption" color="text.secondary">
                                Volume
                              </Typography>
                              <Typography variant="body2">{keyword.searchVolume}</Typography>
                            </Grid>
                            <Grid item xs={4} sm={2}>
                              <Typography variant="caption" color="text.secondary">
                                Difficulty
                              </Typography>
                              <Chip
                                label={keyword.difficulty}
                                size="small"
                                color={
                                  keyword.difficulty === 'Easy'
                                    ? 'success'
                                    : keyword.difficulty === 'Medium'
                                      ? 'warning'
                                      : 'error'
                                }
                              />
                            </Grid>
                            <Grid item xs={4} sm={2}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setBlogKeyword(keyword.keyword)
                                  setActiveTab(0)
                                }}
                              >
                                Use
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 400,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'grey.50'
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Keyword suggestions will appear here
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Keyword Queue Tab */}
          <TabPanel value={activeTab} index={2}>
            <KeywordQueueTab />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  )
}
