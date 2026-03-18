'use client'

import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import type { PropertyEstimate } from 'services/API/types'

interface PropertyValueEstimateProps {
  estimate?: PropertyEstimate
  listPrice?: number
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

function Sparkline({ data }: { data: { month: string; value: number }[] }) {
  if (data.length < 2) return null

  const width = 200
  const height = 50
  const padding = 4

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#1976d2"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PropertyValueEstimate: React.FC<PropertyValueEstimateProps> = ({
  estimate,
  listPrice,
}) => {
  if (!estimate || !estimate.value) return null

  const { low, high, value, confidence } = estimate
  const range = high - low || 1
  const markerPercent = ((value - low) / range) * 100

  // List price comparison
  let comparisonText: string | null = null
  if (listPrice && listPrice > 0) {
    const diff = listPrice - value
    const absDiff = Math.abs(diff)
    if (diff > 0) {
      comparisonText = `Listed ${formatCurrency(absDiff)} above estimate`
    } else if (diff < 0) {
      comparisonText = `Listed ${formatCurrency(absDiff)} below estimate`
    }
  }

  // Sparkline data from history.mth
  const sparklineData: { month: string; value: number }[] = []
  if (estimate.history?.mth) {
    const entries = Object.entries(estimate.history.mth)
      .filter(([, v]) => v && v.value)
      .sort(([a], [b]) => a.localeCompare(b))
    const recent = entries.slice(-12)
    for (const [month, v] of recent) {
      sparklineData.push({ month, value: v.value })
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Estimated Market Value
        </Typography>

        <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
          {formatCurrency(value)}
        </Typography>

        {/* Range bar */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
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
              bgcolor: 'grey.200',
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
                  'linear-gradient(90deg, #e3f2fd 0%, #1976d2 50%, #e3f2fd 100%)',
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
                boxShadow: 1,
              }}
            />
          </Box>
        </Box>

        {/* Confidence */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Confidence: {Math.round(confidence)}%
        </Typography>

        {/* List price comparison */}
        {comparisonText && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {comparisonText}
          </Typography>
        )}

        {/* Sparkline */}
        {sparklineData.length >= 2 && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Value Trend
            </Typography>
            <Sparkline data={sparklineData} />
          </Box>
        )}

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
  )
}

export default PropertyValueEstimate
