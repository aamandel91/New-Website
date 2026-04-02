'use client'

import React, { useState } from 'react'

import { Close as CloseIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography
} from '@mui/material'

import type { PropertyEstimate } from 'services/API/types'
import { ssIdentify } from 'utils/suresendTracking'

interface PropertyValueEstimateProps {
  estimate?: PropertyEstimate
  listPrice?: number
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

// ---------------------------------------------------------------------------
// Confidence Badge
// ---------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let label: string
  let color: string
  let bgColor: string

  if (confidence < 0.15) {
    label = 'High Confidence'
    color = '#2e7d32'
    bgColor = '#e8f5e9'
  } else if (confidence <= 0.25) {
    label = 'Medium Confidence'
    color = '#f57f17'
    bgColor = '#fff8e1'
  } else {
    label = 'Low Confidence'
    color = '#c62828'
    bgColor = '#ffebee'
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        fontSize: '0.8rem',
        fontWeight: 600,
        color,
        bgcolor: bgColor
      }}
    >
      {label}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Full 24-month SVG Line Chart
// ---------------------------------------------------------------------------

const PADDING = { top: 16, right: 16, bottom: 28, left: 56 }

function HistoryLineChart({
  data
}: {
  data: { month: string; value: number }[]
}) {
  if (data.length < 2) return null

  const width = 500
  const height = 180
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

  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.value) }))
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ')
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${PADDING.top + chartH}` +
    ` L${points[0].x},${PADDING.top + chartH} Z`

  const formatShort = (v: number): string => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${Math.round(v / 1_000)}k`
    return `$${v}`
  }

  const yTicks = Array.from(
    { length: 4 },
    (_, i) => yMin + (i / 3) * (yMax - yMin)
  )
  const xLabelStep = Math.max(1, Math.floor(data.length / 6))

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="pdp-estimate-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1976d2" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#1976d2" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {yTicks.map((tick, i) => (
        <React.Fragment key={`y-${i}`}>
          <line
            x1={PADDING.left}
            y1={yScale(tick)}
            x2={width - PADDING.right}
            y2={yScale(tick)}
            stroke="#e0e0e0"
            strokeDasharray="4 4"
          />
          <text
            x={PADDING.left - 6}
            y={yScale(tick) + 4}
            textAnchor="end"
            fill="#999"
            fontSize={11}
          >
            {formatShort(Math.round(tick))}
          </text>
        </React.Fragment>
      ))}
      {data.map((d, i) =>
        i % xLabelStep === 0 || i === data.length - 1 ? (
          <text
            key={`x-${i}`}
            x={xScale(i)}
            y={height - 4}
            textAnchor="middle"
            fill="#999"
            fontSize={11}
          >
            {new Date(d.month + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit'
            })}
          </text>
        ) : null
      )}
      <path d={areaPath} fill="url(#pdp-estimate-area)" />
      <path
        d={linePath}
        fill="none"
        stroke="#1976d2"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#1976d2"
          stroke="#fff"
          strokeWidth={1.5}
        >
          <title>
            {new Date(data[i].month + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit'
            })}
            : {formatCurrency(data[i].value)}
          </title>
        </circle>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PropertyValueEstimate: React.FC<PropertyValueEstimateProps> = ({
  estimate,
  listPrice
}) => {
  const [trackModalOpen, setTrackModalOpen] = useState(false)
  const [trackEmail, setTrackEmail] = useState('')
  const [trackSubmitting, setTrackSubmitting] = useState(false)
  const [trackSubmitted, setTrackSubmitted] = useState(false)

  if (!estimate || !estimate.value) return null

  const { low, high, value, confidence } = estimate
  const range = high - low || 1
  const markerPercent = ((value - low) / range) * 100

  // List price comparison
  let comparisonText: string | null = null
  let comparisonColor: string | null = null
  if (listPrice && listPrice > 0) {
    const diff = listPrice - value
    const absDiff = Math.abs(diff)
    if (diff > 0) {
      comparisonText = `Listed ${formatCurrency(absDiff)} above estimate`
      comparisonColor = '#c62828'
    } else if (diff < 0) {
      comparisonText = `Listed ${formatCurrency(absDiff)} below estimate`
      comparisonColor = '#2e7d32'
    }
  }

  // History data from history.mth (up to 24 months)
  const historyData: { month: string; value: number }[] = []
  if (estimate.history?.mth) {
    const entries = Object.entries(estimate.history.mth)
      .filter(([, v]) => v && v.value)
      .sort(([a], [b]) => a.localeCompare(b))
    const recent = entries.slice(-24)
    for (const [month, v] of recent) {
      historyData.push({ month, value: v.value })
    }
  }

  const handleTrackSubmit = async () => {
    if (!trackEmail.trim()) return
    setTrackSubmitting(true)
    try {
      ssIdentify({ email: trackEmail.trim() })
      await fetch('/api/suresend/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'form_submission',
          email: trackEmail.trim(),
          metadata: {
            source: 'property_tracker',
            tags: 'property_tracker',
            estimatedValue: value
          }
        })
      })
      setTrackSubmitted(true)
    } catch {
      setTrackSubmitted(true)
    } finally {
      setTrackSubmitting(false)
    }
  }

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Estimated Market Value
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            color="primary.main"
            gutterBottom
          >
            {formatCurrency(value)}
          </Typography>

          {/* Confidence badge */}
          <Box sx={{ mb: 2 }}>
            <ConfidenceBadge confidence={confidence} />
          </Box>

          {/* Range bar */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(low)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(high)}
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'relative',
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '100%',
                  borderRadius: 4,
                  background:
                    'linear-gradient(90deg, #e3f2fd 0%, #1976d2 50%, #e3f2fd 100%)'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${Math.min(Math.max(markerPercent, 2), 98)}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  border: '2px solid white',
                  boxShadow: 1
                }}
              />
            </Box>
          </Box>

          {/* List price comparison with color */}
          {comparisonText && (
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ mb: 1, color: comparisonColor }}
            >
              {comparisonText}
            </Typography>
          )}

          {/* Full history line chart */}
          {historyData.length >= 2 && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Value History (24 months)
              </Typography>
              <HistoryLineChart data={historyData} />
            </Box>
          )}

          {/* Track This Home's Value */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => setTrackModalOpen(true)}
            sx={{ mt: 2 }}
          >
            Track This Home&apos;s Value
          </Button>

          {/* Disclaimer */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}
          >
            This is a computer-generated estimate and not an appraisal.
          </Typography>
        </CardContent>
      </Card>

      {/* Track modal */}
      <Dialog
        open={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          Track This Home&apos;s Value
          <IconButton size="small" onClick={() => setTrackModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {!trackSubmitted ? (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Get notified when this property&apos;s estimated value changes.
              </Typography>
              <TextField
                label="Email address"
                value={trackEmail}
                onChange={(e) => setTrackEmail(e.target.value)}
                fullWidth
                type="email"
                size="small"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleTrackSubmit}
                disabled={!trackEmail.trim() || trackSubmitting}
                startIcon={
                  trackSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : undefined
                }
              >
                {trackSubmitting ? 'Submitting...' : 'Start Tracking'}
              </Button>
            </Box>
          ) : (
            <Typography
              variant="body1"
              color="success.main"
              sx={{ py: 2, textAlign: 'center' }}
            >
              You&apos;re all set! We&apos;ll notify you of value changes.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PropertyValueEstimate
