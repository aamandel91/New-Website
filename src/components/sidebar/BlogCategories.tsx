'use client'

import React, { useEffect, useState } from 'react'
import { Box, List, ListItem, Skeleton, Typography } from '@mui/material'

const NAVY = '#0F1621'

interface Category {
  name: string
  count: number
  slug: string
}

interface BlogCategoriesProps {
  categories?: Category[]
}

export default function BlogCategories({ categories: propCategories }: BlogCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>(propCategories || [])
  const [loading, setLoading] = useState(!propCategories)

  useEffect(() => {
    if (propCategories) return

    let cancelled = false

    async function fetchCategories() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(`${apiUrl}/api/blogs/categories`)
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        if (!cancelled) {
          setCategories(
            (data.categories || []).map((c: any) => ({
              name: c.name || c,
              count: c.count || 0,
              slug: (c.slug || c.name || c).toLowerCase().replace(/\s+/g, '-'),
            }))
          )
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCategories()
    return () => { cancelled = true }
  }, [propCategories])

  if (loading) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: NAVY }}>
          Categories
        </Typography>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={24} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    )
  }

  if (categories.length === 0) return null

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: NAVY }}>
        Categories
      </Typography>
      <List dense disablePadding>
        {categories.map((cat) => (
          <ListItem key={cat.slug} disablePadding sx={{ py: 0.3 }}>
            <Box
              component="a"
              href={`/blog/category/${cat.slug}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <Typography variant="body2">{cat.name}</Typography>
              {cat.count > 0 && (
                <Typography variant="body2" color="text.secondary">
                  ({cat.count})
                </Typography>
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
