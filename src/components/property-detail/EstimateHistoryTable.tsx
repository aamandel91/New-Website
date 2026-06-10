'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material'

interface EstimateHistoryTableProps {
  history?: { mth: Record<string, { value: number }> }
  currentEstimate?: number
}

interface MonthRow {
  month: string
  label: string
  value: number
  change: number | null
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

function formatMonthLabel(yyyymm: string): string {
  const [year, month] = yyyymm.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

const ROWS_PER_PAGE = 6
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 70 }

function EstimateLineChart({ data }: { data: MonthRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const height = 280

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

  // Use up to 24 months, ascending order for chart
  const chartData = useMemo(() => {
    const sorted = [...data].reverse()
    return sorted.slice(-24)
  }, [data])

  if (chartData.length < 2) return null

  const chartW = width - CHART_PADDING.left - CHART_PADDING.right
  const chartH = height - CHART_PADDING.top - CHART_PADDING.bottom

  const values = chartData.map((d) => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const valRange = maxVal - minVal || 1
  const valPad = valRange * 0.1
  const yMin = minVal - valPad
  const yMax = maxVal + valPad

  const xScale = (i: number) =>
    CHART_PADDING.left + (i / (chartData.length - 1)) * chartW
  const yScale = (val: number) =>
    CHART_PADDING.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH

  const overall = chartData[chartData.length - 1].value - chartData[0].value
  const lineColor = overall >= 0 ? '#4caf50' : '#ef5350'
  const gradientId = 'estimate-history-gradient'

  // Build line path
  const linePath = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.value)}`)
    .join(' ')

  // Build area path (fill under line)
  const areaPath =
    linePath +
    ` L${xScale(chartData.length - 1)},${CHART_PADDING.top + chartH}` +
    ` L${xScale(0)},${CHART_PADDING.top + chartH} Z`

  // Y-axis ticks (~5)
  const yTicks: number[] = []
  const tickStep = (yMax - yMin) / 4
  for (let i = 0; i <= 4; i++) {
    yTicks.push(yMin + tickStep * i)
  }

  // X-axis labels (~6 evenly spaced)
  const xLabelCount = Math.min(6, chartData.length)
  const xLabels: { index: number; label: string }[] = []
  for (let i = 0; i < xLabelCount; i++) {
    const idx = Math.round((i / (xLabelCount - 1)) * (chartData.length - 1))
    xLabels.push({ index: idx, label: chartData[idx].label })
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%', mt: 2 }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Estimate value history chart"
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
            key={i}
            x1={CHART_PADDING.left}
            y1={yScale(tick)}
            x2={width - CHART_PADDING.right}
            y2={yScale(tick)}
            stroke="#e0e0e0"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={CHART_PADDING.left - 8}
            y={yScale(tick) + 4}
            textAnchor="end"
            fontSize={11}
            fill="#757575"
          >
            {formatCurrency(Math.round(tick))}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ index, label }) => (
          <text
            key={index}
            x={xScale(index)}
            y={height - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#757575"
          >
            {label}
          </text>
        ))}

        {/* Gradient fill area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.value)}
            r={3}
            fill={lineColor}
          />
        ))}
      </svg>
    </Box>
  )
}

const EstimateHistoryTable: React.FC<EstimateHistoryTableProps> = ({
  history,
  currentEstimate
}) => {
  const [page, setPage] = useState(0)

  const rows: MonthRow[] = useMemo(() => {
    if (!history?.mth) return []
    const entries = Object.entries(history.mth)
      .filter(([, v]) => v && v.value)
      .sort(([a], [b]) => b.localeCompare(a)) // descending (newest first)

    return entries.map(([month, v], i) => {
      const prevEntry = entries[i + 1]
      const change = prevEntry ? v.value - prevEntry[1].value : null
      return {
        month,
        label: formatMonthLabel(month),
        value: v.value,
        change
      }
    })
  }, [history])

  if (rows.length === 0) return null

  const paginatedRows = rows.slice(
    page * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE + ROWS_PER_PAGE
  )

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Estimate History
        </Typography>

        {currentEstimate != null && (
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary.main"
            sx={{ mb: 2 }}
          >
            {formatCurrency(currentEstimate)}
          </Typography>
        )}

        {/* Line chart */}
        <EstimateLineChart data={rows} />

        {/* Table */}
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Month
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Estimated Value
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Change
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.value)}
                  </TableCell>
                  <TableCell align="right">
                    {row.change != null ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: row.change >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {row.change >= 0 ? (
                          <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                        )}
                        <Typography variant="body2" component="span">
                          {formatCurrency(Math.abs(row.change))}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {rows.length > ROWS_PER_PAGE && (
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default EstimateHistoryTable
