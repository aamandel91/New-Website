'use client'

import React, { useEffect, useState } from 'react'

import { Box, Chip, Skeleton, Typography } from '@mui/material'

const NAVY = '#0F1621'

export default function BlogTags() {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchTags() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(`${apiUrl}/api/blogs/tags`)
        if (!res.ok) throw new Error('Failed to fetch tags')
        const data = await res.json()
        if (!cancelled) {
          setTags(
            (data.tags || [])
              .map((t: any) => (typeof t === 'string' ? t : t.name || ''))
              .filter(Boolean)
          )
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTags()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 1.5, color: NAVY }}
        >
          Tags
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={60} height={24} />
          ))}
        </Box>
      </Box>
    )
  }

  if (tags.length === 0) return null

  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1, color: NAVY }}
      >
        Tags
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            component="a"
            href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
            clickable
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              height: 24,
              borderRadius: '12px',
              '&:hover': { bgcolor: 'rgba(196,169,110,0.08)' }
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
