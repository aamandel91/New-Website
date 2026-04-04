'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, ButtonGroup, Paper, Stack, Typography } from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material'

import MarketGraphFilters from '@shared/MarketGraphFilters'
import type { MarketGraphFilterValues } from '@shared/MarketGraphFilters'
import type { MonthlyDataPoint, MarketTimelineResult } from 'services/marketTimeline'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketTimelineGraphProps {
  city: string
  initialData?: MarketTimelineResult
}

type RangeKey = '6M' | '1Y' | '2Y' | '5Y'

const RANGE_MONTHS: Record<RangeKey, number> = {
  '6M': 6,
  '1Y': 12,
  '2Y': 24,
  '5Y': 60,
}

// ---------------------------------------------------------------------------
// SVG Layout Constants
// ---------------------------------------------------------------------------

const PADDING = { top: 20, right: 20, bottom: 30, left: 60 }
const POINT_RADIUS = 4
const HOVER_RADIUS = 6

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatPriceShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

function formatPriceFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function formatMonthLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// SVG Chart (inline, crawlable)
// ---------------------------------------------------------------------------

interface InlineSVGChartProps {
  data: MonthlyDataPoint[]
  trendDirection: 'up' | 'down' | 'flat'
  width: number
  height: number
}

function InlineSVGChart({ data, trendDirection, width, height }: InlineSVGChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="No market data available"
      >
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#999" fontSize={14}>
          No data available for this period
        </text>
      </svg>
    )
  }

  const chartW = width - PADDING.left - PADDING.right
  const chartH = height - PADDING.top - PADDING.bottom

  // Scale
  const prices = data.map((d) => d.avgPrice)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1
  const pricePad = priceRange * 0.1
  const yMin = minPrice - pricePad
  const yMax = maxPrice + pricePad

  const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * chartW
  const yScale = (val: number) =>
    PADDING.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH

  // Line color
  const lineColor = trendDirection === 'down' ? '#ef5350' : '#4caf50'
  const gradientId = `market-gradient-${trendDirection}`

  // Build path
  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.avgPrice) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  // Fill area path (close to bottom)
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${PADDING.top + chartH}` +
    ` L${points[0].x},${PADDING.top + chartH} Z`

  // Y-axis ticks (5 ticks)
  const yTicks: number[] = []
  for (let i = 0; i <= 4; i++) {
    yTicks.push(yMin + (i / 4) * (yMax - yMin))
  }

  // X-axis labels — show ~6 evenly spaced
  const xLabelStep = Math.max(1, Math.floor(data.length / 6))

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Market timeline chart showing average sold prices. Trend: ${trendDirection}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
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
          x={PADDING.left - 8}
          y={yScale(tick) + 4}
          textAnchor="end"
          fill="#999"
          fontSize={11}
        >
          {formatPriceShort(Math.round(tick))}
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

      {/* Gradient fill area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={`point-${i}`}>
          <circle
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? HOVER_RADIUS : POINT_RADIUS}
            fill={lineColor}
            stroke="#fff"
            strokeWidth={2}
            style={{ transition: 'r 0.15s ease' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <title>
              {formatMonthLong(data[i].date)}: Avg {formatPriceFull(data[i].avgPrice)} | Median{' '}
              {formatPriceFull(data[i].medPrice)} | {data[i].count} sales
            </title>
          </circle>
        </g>
      ))}

      {/* Hover vertical line */}
      {hoveredIdx !== null && (
        <line
          x1={points[hoveredIdx].x}
          y1={PADDING.top}
          x2={points[hoveredIdx].x}
          y2={PADDING.top + chartH}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
          pointerEvents="none"
        />
      )}

      {/* Invisible hit targets for better hover on mobile/desktop */}
      {points.map((p, i) => (
        <rect
          key={`hit-${i}`}
          x={p.x - (chartW / data.length) / 2}
          y={PADDING.top}
          width={chartW / data.length}
          height={chartH}
          fill="transparent"
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <title>
            {formatMonthLong(data[i].date)}: Avg {formatPriceFull(data[i].avgPrice)} | Median{' '}
            {formatPriceFull(data[i].medPrice)} | {data[i].count} sales
          </title>
        </rect>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const MarketTimelineGraph: React.FC<MarketTimelineGraphProps> = ({
  city,
  initialData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(700)
  const [range, setRange] = useState<RangeKey>('1Y')
  const [filters, setFilters] = useState<MarketGraphFilterValues>({})
  const [result, setResult] = useState<MarketTimelineResult | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)

  // Measure container width for responsive SVG
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

  // Fetch data when range or filters change
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ city, months: String(RANGE_MONTHS[range]) })
      if (filters.beds) params.set('beds', filters.beds)
      if (filters.baths) params.set('baths', filters.baths)
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.propertyType) params.set('propertyType', filters.propertyType)

      const res = await fetch(`/api/market-timeline?${params.toString()}`)
      if (res.ok) {
        const data: MarketTimelineResult = await res.json()
        setResult(data)
      }
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false)
    }
  }, [city, range, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const data = result?.data ?? []
  const trend = result?.trend ?? { direction: 'flat' as const, percentage: 0 }
  const summary = result?.summary ?? { avgPrice: 0, medPrice: 0, avgDaysOnMarket: 0 }

  const svgHeight = Math.max(250, Math.min(350, containerWidth * 0.45))

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" component="h2">
          Market Trends in {city}
        </Typography>

        <ButtonGroup size="small" variant="outlined">
          {(Object.keys(RANGE_MONTHS) as RangeKey[]).map((key) => (
            <Button
              key={key}
              onClick={() => setRange(key)}
              variant={range === key ? 'contained' : 'outlined'}
              sx={{ minWidth: 44 }}
            >
              {key}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      <MarketGraphFilters filters={filters} onFilterChange={setFilters} />

      {/* SVG Chart Container */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          minHeight: 250,
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        {data.length === 0 && !loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 250,
              color: 'text.secondary',
              gap: 1.5,
            }}
          >
            <BarChartIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            <Typography variant="body1" fontWeight={500} color="text.secondary">
              No market data available yet
            </Typography>
            <Typography variant="body2" color="text.disabled" textAlign="center">
              Market trend data for {city} will appear here once enough sales data is collected.
            </Typography>
          </Box>
        ) : (
          <InlineSVGChart
            data={data}
            trendDirection={trend.direction}
            width={containerWidth}
            height={svgHeight}
          />
        )}
      </Box>

      {/* Trend Summary */}
      {data.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 3 }}
            alignItems={{ sm: 'center' }}
          >
            {/* Trend indicator */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {trend.direction === 'up' ? (
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
              ) : trend.direction === 'down' ? (
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
              ) : null}
              <Typography
                variant="body2"
                fontWeight="bold"
                color={
                  trend.direction === 'up'
                    ? 'success.main'
                    : trend.direction === 'down'
                      ? 'error.main'
                      : 'text.secondary'
                }
              >
                {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2194'}{' '}
                {trend.direction === 'flat'
                  ? 'Flat'
                  : `${trend.direction === 'up' ? 'Up' : 'Down'} ${trend.percentage}%`}
              </Typography>
            </Stack>

            {/* Summary stats */}
            {summary.avgPrice > 0 && (
              <Typography variant="body2" color="text.secondary">
                Avg: <strong>{formatPriceFull(summary.avgPrice)}</strong>
              </Typography>
            )}
            {summary.medPrice > 0 && (
              <Typography variant="body2" color="text.secondary">
                Median: <strong>{formatPriceFull(summary.medPrice)}</strong>
              </Typography>
            )}
            {summary.avgDaysOnMarket > 0 && (
              <Typography variant="body2" color="text.secondary">
                Avg DOM: <strong>{summary.avgDaysOnMarket} days</strong>
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  )
}

export default MarketTimelineGraph
