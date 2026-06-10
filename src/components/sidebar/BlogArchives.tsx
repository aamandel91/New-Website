'use client'

import React, { useEffect, useState } from 'react'

import { Box, List, ListItem, Skeleton, Typography } from '@mui/material'

import type { Blog } from '@/types/blog'

const NAVY = '#0F1621'

interface ArchiveEntry {
  label: string
  count: number
  year: number
  month: number
}

export default function BlogArchives() {
  const [archives, setArchives] = useState<ArchiveEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchArchives() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(
          `${apiUrl}/api/blogs?limit=100&status=published`
        )
        if (!res.ok) throw new Error('Failed to fetch blogs')
        const data = await res.json()
        const blogs: Blog[] = data.blogs || []

        // Group by year/month
        const groups = new Map<
          string,
          { count: number; year: number; month: number }
        >()
        for (const blog of blogs) {
          const d = new Date(blog.published_at || blog.created_at)
          const year = d.getFullYear()
          const month = d.getMonth() + 1
          const key = `${year}-${month}`
          const existing = groups.get(key)
          if (existing) {
            existing.count++
          } else {
            groups.set(key, { count: 1, year, month })
          }
        }

        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ]

        const entries: ArchiveEntry[] = Array.from(groups.values())
          .sort((a, b) => b.year - a.year || b.month - a.month)
          .map((g) => ({
            label: `${monthNames[g.month - 1]} ${g.year}`,
            count: g.count,
            year: g.year,
            month: g.month
          }))

        if (!cancelled) setArchives(entries)
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchArchives()
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
          Archives
        </Typography>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={24} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    )
  }

  if (archives.length === 0) return null

  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1, color: NAVY }}
      >
        Archives
      </Typography>
      <List dense disablePadding>
        {archives.map((entry) => (
          <ListItem
            key={`${entry.year}-${entry.month}`}
            disablePadding
            sx={{ py: 0.3 }}
          >
            <Typography
              component="a"
              href={`/blog/archive/${entry.year}/${entry.month}`}
              variant="body2"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {entry.label} ({entry.count})
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
