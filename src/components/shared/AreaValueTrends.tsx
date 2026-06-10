'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Paper, Stack, Typography } from '@mui/material'

import type { Property } from 'services/API'
import APISearchCSR from 'services/API/APISearchCSR'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AreaValueTrendsProps {
  city: string
  neighborhood?: string
}

interface MonthValue {
  date: string
  value: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// ---------------------------------------------------------------------------
// SVG Line Chart (matches MarketTimelineGraph pattern)
// ---------------------------------------------------------------------------

const PADDING = { top: 16, right: 16, bottom: 28, left: 56 }

function TrendLineChart({
  data,
  trendDirection,
  width,
  height
}: {
  data: MonthValue[]
  trendDirection: 'up' | 'down' | 'flat'
  width: number
  height: number
}) {
  if (data.length < 2) return null

  const chartW = width - PADDING.left - PADDING.right
  const chartH = height - PADDING.top - PADDING.bottom

  const values = data.map((d) => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const pad = range * 0.1
  const yMin = minVal - pad
  const yMax = maxVal + pad

  const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * chartW
  const yScale = (val: number) =>
    PADDING.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH

  const lineColor = trendDirection === 'down' ? '#ef5350' : '#4caf50'
  const gradientId = `area-trend-${trendDirection}`

  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.value) }))
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ')

  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${PADDING.top + chartH}` +
    ` L${points[0].x},${PADDING.top + chartH} Z`

  // Y-axis ticks (4 ticks)
  const yTicks: number[] = []
  for (let i = 0; i <= 3; i++) {
    yTicks.push(yMin + (i / 3) * (yMax - yMin))
  }

  const formatShort = (v: number): string => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${Math.round(v / 1_000)}k`
    return `$${v}`
  }

  // X-axis labels — ~6 evenly spaced
  const xLabelStep = Math.max(1, Math.floor(data.length / 6))

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Area value trend chart. Trend: ${trendDirection}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <line
          key={`grid-${i}`}
          x1={PADDING.left}
          y1={yScale(tick)}
          x2={width - PADDING.right}
          y2={yScale(tick)}
          stroke="#e0e0e0"
          strokeDasharray="4 4"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => (
        <text
          key={`ytick-${i}`}
          x={PADDING.left - 6}
          y={yScale(tick) + 4}
          textAnchor="end"
          fill="#999"
          fontSize={11}
        >
          {formatShort(Math.round(tick))}
        </text>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) =>
        i % xLabelStep === 0 || i === data.length - 1 ? (
          <text
            key={`xtick-${i}`}
            x={xScale(i)}
            y={height - 4}
            textAnchor="middle"
            fill="#999"
            fontSize={11}
          >
            {formatMonth(d.date)}
          </text>
        ) : null
      )}

      {/* Fill area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={lineColor}
          stroke="#fff"
          strokeWidth={1.5}
        >
          <title>
            {formatMonth(data[i].date)}: {formatCurrency(data[i].value)}
          </title>
        </circle>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const AreaValueTrends: React.FC<AreaValueTrendsProps> = ({
  city,
  neighborhood
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [avgValue, setAvgValue] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthValue[]>([])
  const [propertyCount, setPropertyCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [hasData, setHasData] = useState(false)

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    setContainerWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const response = await APISearchCSR.searchListings({
        boardId: 110,
        city,
        ...(neighborhood ? { neighborhood } : {}),
        status: 'A',
        resultsPerPage: 50,
        hasImages: true,
        fields: 'estimate'
      })

      if (!response || !response.listings) {
        setLoaded(true)
        return
      }

      const listings: Property[] = response.listings

      // Extract estimate values from listings
      const withEstimates = listings.filter(
        (l) => l.estimate && l.estimate.value && l.estimate.value > 0
      )

      if (withEstimates.length === 0) {
        setLoaded(true)
        return
      }

      // Compute average estimated value
      const total = withEstimates.reduce((sum, l) => sum + l.estimate!.value, 0)
      const avg = Math.round(total / withEstimates.length)

      // Aggregate monthly history across listings
      const monthMap: Record<string, { total: number; count: number }> = {}
      for (const listing of withEstimates) {
        const mth = listing.estimate?.history?.mth
        if (!mth) continue
        for (const [month, data] of Object.entries(mth)) {
          if (!data || !data.value) continue
          if (!monthMap[month]) {
            monthMap[month] = { total: 0, count: 0 }
          }
          monthMap[month].total += data.value
          monthMap[month].count += 1
        }
      }

      const sorted = Object.entries(monthMap)
        .map(([date, { total, count }]) => ({
          date,
          value: Math.round(total / count)
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-24) // last 24 months

      setAvgValue(avg)
      setMonthlyData(sorted)
      setPropertyCount(withEstimates.length)
      setHasData(true)
    } catch {
      // Gracefully show nothing
    } finally {
      setLoaded(true)
    }
  }, [city, neighborhood])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Don't render anything if no estimate data
  if (!loaded || !hasData) return null

  // Compute year-over-year trend
  let trendDirection: 'up' | 'down' | 'flat' = 'flat'
  let trendPercentage = 0

  if (monthlyData.length >= 12) {
    const recent = monthlyData.slice(-3)
    const yearAgo = monthlyData.slice(-15, -12)
    if (yearAgo.length > 0) {
      const recentAvg = recent.reduce((s, d) => s + d.value, 0) / recent.length
      const yearAgoAvg =
        yearAgo.reduce((s, d) => s + d.value, 0) / yearAgo.length
      if (yearAgoAvg > 0) {
        const pct = ((recentAvg - yearAgoAvg) / yearAgoAvg) * 100
        trendPercentage = Math.round(Math.abs(pct) * 10) / 10
        trendDirection = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat'
      }
    }
  }

  const areaLabel = neighborhood || city
  const svgHeight = Math.max(200, Math.min(280, containerWidth * 0.4))

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Average Estimated Home Value in {areaLabel}
      </Typography>

      <Typography
        variant="h4"
        fontWeight={700}
        color="primary.main"
        gutterBottom
      >
        {formatCurrency(avgValue)}
      </Typography>

      {/* SVG Chart */}
      {monthlyData.length >= 2 && (
        <Box ref={containerRef} sx={{ mt: 2, minHeight: 200 }}>
          <TrendLineChart
            data={monthlyData}
            trendDirection={trendDirection}
            width={containerWidth}
            height={svgHeight}
          />
        </Box>
      )}

      {/* Trend Summary */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
        >
          {trendDirection !== 'flat' && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {trendDirection === 'up' ? (
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
              ) : (
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
              )}
              <Typography
                variant="body2"
                fontWeight="bold"
                color={trendDirection === 'up' ? 'success.main' : 'error.main'}
              >
                {trendDirection === 'up' ? '\u2191' : '\u2193'}{' '}
                {trendDirection === 'up' ? 'Up' : 'Down'} {trendPercentage}%
                over the past year
              </Typography>
            </Stack>
          )}
          {trendDirection === 'flat' && (
            <Typography variant="body2" color="text.secondary">
              Flat over the past year
            </Typography>
          )}
        </Stack>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.5, display: 'block', fontStyle: 'italic' }}
      >
        This is based on AI-powered estimates for {propertyCount} properties in{' '}
        {areaLabel}.
      </Typography>
    </Paper>
  )
}

export default AreaValueTrends
