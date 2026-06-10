'use client'

import React, { useEffect, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import ResetIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'

const DEFAULT_ROBOTS = `# Robots.txt
# Control how search engines crawl your site

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /*.json$
Disallow: /*?*
Disallow: /*#*

# Sitemap location
Sitemap: https://example.com/sitemap.xml

# Crawl delay in seconds
Crawl-delay: 1
`

const COMMON_RULES = [
  { label: 'Block /admin/', value: 'Disallow: /admin/' },
  { label: 'Block /api/', value: 'Disallow: /api/' },
  { label: 'Block /auth/', value: 'Disallow: /auth/' },
  { label: 'Block query strings', value: 'Disallow: /*?*' },
  { label: 'Block JSON files', value: 'Disallow: /*.json$' },
  { label: 'Block /private/', value: 'Disallow: /private/' },
  { label: 'Allow all', value: 'Allow: /' },
  { label: 'Block all', value: 'Disallow: /' }
]

const AdminRobotsPage = () => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadRobots()
  }, [])

  const loadRobots = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/robots')
      if (!res.ok) throw new Error('Failed to load robots.txt')
      const data = await res.json()
      setContent(data.content)
    } catch (err) {
      console.error('Failed to load robots.txt:', err)
      setError('Failed to load robots.txt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const res = await fetch('/api/admin/robots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save robots.txt')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save robots.txt'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setContent(DEFAULT_ROBOTS)
  }

  const handleAddRule = (rule: string) => {
    if (!content.includes(rule)) {
      setContent((prev) => prev.trimEnd() + '\n' + rule + '\n')
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Robots.txt Editor
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Control how search engines crawl and index your website. The robots.txt
        file tells web crawlers which pages they can or cannot access.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          robots.txt saved successfully!
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            File Contents
          </Typography>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            InputProps={{
              sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
            }}
            placeholder="User-agent: *&#10;Allow: /"
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleReset}
            >
              Reset to Default
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Add Rules
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click a rule to append it to your robots.txt file.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {COMMON_RULES.map((rule) => (
              <Chip
                key={rule.value}
                label={rule.label}
                icon={<AddIcon />}
                onClick={() => handleAddRule(rule.value)}
                variant={content.includes(rule.value) ? 'filled' : 'outlined'}
                color={content.includes(rule.value) ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Common Directives Reference
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography
                variant="subtitle2"
                component="code"
                sx={{ fontFamily: 'monospace' }}
              >
                User-agent: *
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applies rules to all search engine crawlers
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                component="code"
                sx={{ fontFamily: 'monospace' }}
              >
                Allow: /path/
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explicitly allows crawling of a specific path
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                component="code"
                sx={{ fontFamily: 'monospace' }}
              >
                Disallow: /path/
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Blocks crawling of a specific path
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                component="code"
                sx={{ fontFamily: 'monospace' }}
              >
                Sitemap: https://example.com/sitemap.xml
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Points crawlers to your XML sitemap for better indexing
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                component="code"
                sx={{ fontFamily: 'monospace' }}
              >
                Crawl-delay: 1
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requests a delay (in seconds) between successive crawl requests
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

export default AdminRobotsPage
