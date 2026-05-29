'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import APIBlogs from '@/services/API/APIBlogs'
import type { Blog, BlogSuggestedTags } from '@/types/blog'

interface SuggestedTagsPanelProps {
  blogId?: number
  initialBlog?: Blog | null
  /** Called whenever the panel mutates the blog server-side so the parent
   *  editor can refresh its tags state. */
  onBlogChange?: (blog: Blog) => void
}

interface DimensionConfig {
  key: keyof Pick<
    BlogSuggestedTags,
    | 'cities'
    | 'neighborhoods'
    | 'counties'
    | 'topics'
    | 'audience'
    | 'seasonality'
  >
  label: string
  /** How to render the tag string when it gets persisted. The flattened tag
   *  shape mirrors blogAutoTagService.flatten on the backend. */
  toFlatTag: (raw: string) => string
}

const DIMENSIONS: DimensionConfig[] = [
  { key: 'cities', label: 'Cities', toFlatTag: (t) => t },
  { key: 'neighborhoods', label: 'Neighborhoods', toFlatTag: (t) => t },
  { key: 'counties', label: 'Counties', toFlatTag: (t) => t },
  { key: 'topics', label: 'Topics', toFlatTag: (t) => t },
  { key: 'audience', label: 'Audience', toFlatTag: (t) => `audience:${t}` },
  { key: 'seasonality', label: 'Seasonality', toFlatTag: (t) => `season:${t}` }
]

const SuggestedTagsPanel = ({
  blogId,
  initialBlog,
  onBlogChange
}: SuggestedTagsPanelProps) => {
  const [blog, setBlog] = useState<Blog | null>(initialBlog ?? null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<Record<string, boolean>>({})

  // Compute which suggestions are not already accepted/rejected. A "fresh"
  // suggestion is one where the underlying flat tag is neither in blog.tags
  // (already accepted) nor in blog.rejected_tags (previously rejected).
  const freshByDimension = useMemo(() => {
    const out: Record<string, { raw: string; flat: string }[]> = {}
    if (!blog?.suggested_tags) return out
    const accepted = new Set(blog.tags || [])
    const rejected = new Set(blog.rejected_tags || [])
    for (const dim of DIMENSIONS) {
      const items = (blog.suggested_tags[dim.key] || []).map((raw) => ({
        raw,
        flat: dim.toFlatTag(raw)
      }))
      out[dim.key] = items.filter(
        (i) => !accepted.has(i.flat) && !rejected.has(i.flat)
      )
    }
    return out
  }, [blog])

  const handleToggle = (flat: string) => {
    setSelection((prev) => ({ ...prev, [flat]: !prev[flat] }))
  }

  const handleSelectAll = (selected: boolean) => {
    if (!blog?.suggested_tags) return
    const next: Record<string, boolean> = {}
    for (const dim of DIMENSIONS) {
      for (const item of freshByDimension[dim.key] || []) {
        next[item.flat] = selected
      }
    }
    setSelection(next)
  }

  const allFlat: string[] = useMemo(() => {
    return DIMENSIONS.flatMap((dim) =>
      (freshByDimension[dim.key] || []).map((i) => i.flat)
    )
  }, [freshByDimension])

  const handleApply = async (mode: 'accept' | 'reject') => {
    if (!blogId) return
    const chosen = allFlat.filter((t) => selection[t])
    if (chosen.length === 0) return
    try {
      setError(null)
      const decisions =
        mode === 'accept'
          ? { accepted: chosen, rejected: [] }
          : { accepted: [], rejected: chosen }
      const res = await APIBlogs.applyAutoTagDecisions(blogId, decisions)
      setBlog(res.blog)
      setSelection({})
      onBlogChange?.(res.blog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply decisions')
    }
  }

  const handleRerun = async () => {
    if (!blogId) return
    try {
      setRunning(true)
      setError(null)
      const res = await APIBlogs.runAutoTag(blogId)
      setBlog(res.blog)
      setSelection({})
      onBlogChange?.(res.blog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-run AI')
    } finally {
      setRunning(false)
    }
  }

  if (!blogId) {
    return (
      <Alert severity="info">
        Save the blog as a draft to enable AI auto-tagging. Suggestions appear
        after save.
      </Alert>
    )
  }

  const suggested = blog?.suggested_tags
  const total = allFlat.length

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}
      >
        <Typography variant="h6">Suggested Tags (AI)</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleRerun}
          disabled={running}
          startIcon={running ? <CircularProgress size={14} /> : undefined}
        >
          {running ? 'Running...' : 'Re-run AI'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!suggested && (
        <Typography variant="body2" color="text.secondary">
          No AI suggestions yet. Click Re-run AI to generate.
        </Typography>
      )}

      {suggested && !suggested.ok && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Last AI run failed: {suggested.error || 'unknown error'}
        </Alert>
      )}

      {suggested && suggested.ok && total === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          AI ran successfully but found no new tags to suggest (all suggestions
          already accepted or previously rejected).
        </Typography>
      )}

      {suggested && total > 0 && (
        <>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button size="small" onClick={() => handleSelectAll(true)}>
              Select all
            </Button>
            <Button size="small" onClick={() => handleSelectAll(false)}>
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => handleApply('accept')}
            >
              Accept selected
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => handleApply('reject')}
            >
              Reject selected
            </Button>
          </Stack>

          <Stack spacing={2}>
            {DIMENSIONS.map((dim) => {
              const items = freshByDimension[dim.key] || []
              if (items.length === 0) return null
              return (
                <Box key={dim.key}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {dim.label}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {items.map((item) => (
                      <FormControlLabel
                        key={item.flat}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!selection[item.flat]}
                            onChange={() => handleToggle(item.flat)}
                          />
                        }
                        label={item.flat}
                      />
                    ))}
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </>
      )}

      {suggested && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2 }}
        >
          Model: {suggested.model} &middot; Last run:{' '}
          {new Date(suggested.ran_at).toLocaleString()}
          {suggested.truncated ? ' (input truncated to 50KB)' : ''}
        </Typography>
      )}

      {suggested?.reasoning && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
        >
          {suggested.reasoning}
        </Typography>
      )}
    </Paper>
  )
}

export default SuggestedTagsPanel
