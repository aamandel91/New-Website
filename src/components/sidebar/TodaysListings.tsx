'use client'

import React, { useEffect, useState } from 'react'
import { Box, List, ListItem, Skeleton, Typography } from '@mui/material'
import apiSearchCSR from 'services/API/APISearchCSR'

const NAVY = '#0F1621'

interface ListingCount {
  label: string
  count: number
  href: string
}

export default function TodaysListings() {
  const [counts, setCounts] = useState<ListingCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchCounts() {
      try {
        const today = new Date().toISOString().split('T')[0]

        const [allRes, newRes, soldRes] = await Promise.all([
          apiSearchCSR.searchListings({ status: 'A', listings: false }),
          apiSearchCSR.searchListings({ status: 'A', minListDate: today, listings: false }),
          apiSearchCSR.searchListings({ status: 'U', lastStatus: 'Sld', listings: false }),
        ])

        if (cancelled) return

        setCounts([
          {
            label: 'All Residential',
            count: allRes?.count ?? 0,
            href: '/search/gallery',
          },
          {
            label: 'New Today',
            count: newRes?.count ?? 0,
            href: `/search/gallery?sortBy=createdOnDesc`,
          },
          {
            label: 'Price Reduced',
            count: 0,
            href: `/search/gallery?sortBy=priceReducedDate`,
          },
          {
            label: 'Recently Sold',
            count: soldRes?.count ?? 0,
            href: '/search/gallery?status=U&lastStatus=Sld',
          },
        ])
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCounts()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: NAVY }}>
          Today&apos;s Listings
        </Typography>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={28} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: NAVY }}>
        Today&apos;s Listings
      </Typography>
      <List dense disablePadding>
        {counts.map((item) => (
          <ListItem
            key={item.label}
            disablePadding
            sx={{ py: 0.4 }}
          >
            <Box
              component="a"
              href={item.href}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <Typography variant="body2">{item.label}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {item.count.toLocaleString()}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
