'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material'
import apiSearchCSRInstance from '@/services/API/APISearchCSR'
import type { CSRSearchParams } from '@/services/API/APISearchCSR'

interface SoldPriceDistributionProps {
  city: string
  neighborhood?: string
  propertyType?: string
}

interface Bucket {
  label: string
  min: number
  max: number
  count: number
}

const BUCKETS_CONFIG: { label: string; min: number; max: number }[] = [
  { label: '$0–200K', min: 0, max: 200_000 },
  { label: '$200–400K', min: 200_000, max: 400_000 },
  { label: '$400–600K', min: 400_000, max: 600_000 },
  { label: '$600–800K', min: 600_000, max: 800_000 },
  { label: '$800K–1M', min: 800_000, max: 1_000_000 },
  { label: '$1–1.5M', min: 1_000_000, max: 1_500_000 },
  { label: '$1.5–2M', min: 1_500_000, max: 2_000_000 },
  { label: '$2M+', min: 2_000_000, max: Infinity },
]

const CHART_PADDING = { top: 10, right: 20, bottom: 10, left: 100 }

function BarChart({ buckets }: { buckets: Bucket[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(500)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const maxCount = Math.max(...buckets.map((b) => b.count), 1)
  const barHeight = 28
  const gap = 8
  const chartW = width - CHART_PADDING.left - CHART_PADDING.right
  const svgHeight =
    CHART_PADDING.top +
    buckets.length * (barHeight + gap) -
    gap +
    CHART_PADDING.bottom

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${width} ${svgHeight}`}
        aria-label="Sold price distribution bar chart"
      >
        {buckets.map((bucket, i) => {
          const y = CHART_PADDING.top + i * (barHeight + gap)
          const barW = maxCount > 0 ? (bucket.count / maxCount) * chartW : 0

          return (
            <g key={bucket.label}>
              {/* Label */}
              <text
                x={CHART_PADDING.left - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize={12}
                fill="#616161"
              >
                {bucket.label}
              </text>

              {/* Bar background */}
              <rect
                x={CHART_PADDING.left}
                y={y}
                width={chartW}
                height={barHeight}
                rx={4}
                fill="#f5f5f5"
              />

              {/* Bar fill */}
              {bucket.count > 0 && (
                <rect
                  x={CHART_PADDING.left}
                  y={y}
                  width={Math.max(barW, 4)}
                  height={barHeight}
                  rx={4}
                  fill="#00897b"
                />
              )}

              {/* Count label */}
              <text
                x={CHART_PADDING.left + Math.max(barW, 4) + 6}
                y={y + barHeight / 2 + 4}
                fontSize={12}
                fontWeight={600}
                fill="#424242"
              >
                {bucket.count}
              </text>
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

const SoldPriceDistribution: React.FC<SoldPriceDistributionProps> = ({
  city,
  neighborhood,
  propertyType,
}) => {
  const [buckets, setBuckets] = useState<Bucket[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const locationLabel = neighborhood || city

  useEffect(() => {
    let cancelled = false

    async function fetchSoldListings() {
      setLoading(true)
      const params: CSRSearchParams = {
        city,
        status: 'U',
        lastStatus: 'Sld',
        resultsPerPage: 100,
        listings: true,
      }
      if (neighborhood) params.neighborhood = neighborhood
      if (propertyType) params.propertyType = propertyType

      const response = await apiSearchCSRInstance.searchListings(params)
      if (cancelled) return

      if (!response?.listings?.length) {
        setBuckets(null)
        setLoading(false)
        return
      }

      const prices = response.listings
        .map((listing) => {
          const sp = listing.soldPrice
          return sp ? parseFloat(String(sp)) : 0
        })
        .filter((p) => p > 0)

      const counted: Bucket[] = BUCKETS_CONFIG.map((cfg) => ({
        ...cfg,
        count: prices.filter((p) => p >= cfg.min && p < cfg.max).length,
      }))

      setTotalCount(prices.length)
      setBuckets(counted)
      setLoading(false)
    }

    fetchSoldListings()
    return () => {
      cancelled = true
    }
  }, [city, neighborhood, propertyType])

  // Filter out empty trailing buckets for cleaner display
  const displayBuckets = useMemo(() => {
    if (!buckets) return []
    // Always show all buckets that have data, plus one empty bucket on each side for context
    let lastNonZero = -1
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i].count > 0) {
        lastNonZero = i
        break
      }
    }
    return buckets.slice(0, Math.min(lastNonZero + 2, buckets.length))
  }, [buckets])

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton width={250} height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    )
  }

  if (!displayBuckets.length) return null

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Sold Price Distribution in {locationLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Based on {totalCount} sale{totalCount !== 1 ? 's' : ''} in the last 6
          months
        </Typography>

        <BarChart buckets={displayBuckets} />
      </CardContent>
    </Card>
  )
}

export default SoldPriceDistribution
