'use client'

import React, { useEffect, useState } from 'react'

import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Skeleton, Typography } from '@mui/material'

import apiSearchCSR from 'services/API/APISearchCSR'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface MarketData {
  medianPrice: number | null
  avgDom: number | null
  activeCount: number | null
  yoyChange: number | null
  condition: 'seller' | 'buyer' | 'balanced'
  trendPoints: number[]
}

interface HowsTheMarketProps {
  city: string
  neighborhood?: string
}

export default function HowsTheMarket({
  city,
  neighborhood
}: HowsTheMarketProps) {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchMarket() {
      try {
        const locationParams: Record<string, unknown> = { city }
        if (neighborhood) locationParams.neighborhood = neighborhood

        const [activeRes, soldRes] = await Promise.all([
          apiSearchCSR.searchListings({
            ...locationParams,
            // Repliers statistics format: metric-field pairs (see MarketTrends/utils).
            // daysOnMarket stats are only allowed with status U — the sold
            // query below provides avg-daysOnMarket.
            statistics: 'med-listPrice',
            status: 'A',
            listings: false,
            resultsPerPage: 1
          } as any),
          apiSearchCSR.searchListings({
            ...locationParams,
            statistics: 'med-soldPrice,avg-daysOnMarket,grp-mth',
            status: 'U',
            lastStatus: 'Sld',
            listings: false,
            resultsPerPage: 1
          } as any)
        ])

        if (cancelled) return

        // CSR API statistics response has richer types than TS definitions
        const activeStats: any = (activeRes as any)?.statistics
        const soldStats: any = (soldRes as any)?.statistics
        const activeCount: number | null = activeRes?.count ?? null
        const medianPrice: number | null =
          activeStats?.listPrice?.med ?? null
        const avgDom: number | null =
          activeStats?.daysOnMarket?.avg ??
          soldStats?.daysOnMarket?.avg ??
          null

        // YoY price change from monthly sold-price data (grp-mth buckets)
        let yoyChange: number | null = null
        const mthData = soldStats?.soldPrice?.mth
        const monthKeys: string[] = mthData ? Object.keys(mthData).sort() : []
        const months: any[] = monthKeys.map((k) => mthData[k])
        if (months.length >= 12) {
          const current =
            months[months.length - 1]?.median ?? months[months.length - 1]?.med
          const yearAgo =
            months[months.length - 13]?.median ??
            months[months.length - 13]?.med ??
            months[months.length - 12]?.median ??
            months[months.length - 12]?.med
          if (current && yearAgo) {
            yoyChange = ((current - yearAgo) / yearAgo) * 100
          }
        }

        // Market condition based on inventory (months of supply)
        let condition: 'seller' | 'buyer' | 'balanced' = 'balanced'
        const lastMonth = months.length > 0 ? months[months.length - 1] : null
        const soldPerMonth: number = lastMonth?.count || 0
        if (activeCount && soldPerMonth > 0) {
          const monthsOfSupply = activeCount / soldPerMonth
          if (monthsOfSupply < 4) condition = 'seller'
          else if (monthsOfSupply > 6) condition = 'buyer'
        }

        // Trend points (last 6 months median sold prices)
        const trendPoints: number[] = []
        const recentMonths = months.slice(-6)
        for (const m of recentMonths) {
          const val = m?.median ?? m?.med
          if (val) trendPoints.push(val)
        }

        setData({
          medianPrice,
          avgDom,
          activeCount,
          yoyChange,
          condition,
          trendPoints
        })
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMarket()
    return () => {
      cancelled = true
    }
  }, [city, neighborhood])

  if (loading) {
    return (
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 1.5, color: NAVY }}
        >
          How&apos;s the Market?
        </Typography>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mb: 1, color: NAVY }}
        >
          How&apos;s the Market?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Market data coming soon
        </Typography>
      </Box>
    )
  }

  const conditionLabel =
    data.condition === 'seller'
      ? "Seller's Market"
      : data.condition === 'buyer'
        ? "Buyer's Market"
        : 'Balanced Market'
  const conditionColor =
    data.condition === 'seller'
      ? '#f44336'
      : data.condition === 'buyer'
        ? '#4caf50'
        : GOLD

  // Mini SVG trend line
  const trendSvg =
    data.trendPoints.length >= 2
      ? (() => {
          const min = Math.min(...data.trendPoints)
          const max = Math.max(...data.trendPoints)
          const range = max - min || 1
          const w = 120
          const h = 30
          const points = data.trendPoints
            .map((v, i) => {
              const x = (i / (data.trendPoints.length - 1)) * w
              const y = h - ((v - min) / range) * (h - 4) - 2
              return `${x},${y}`
            })
            .join(' ')
          const isUp =
            data.trendPoints[data.trendPoints.length - 1] >= data.trendPoints[0]
          const strokeColor = isUp ? '#4caf50' : '#f44336'
          return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              <polyline
                points={points}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        })()
      : null

  const citySlug = slugify(city)

  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1.5, color: NAVY }}
      >
        How&apos;s the Market?
      </Typography>

      {/* Condition gauge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: conditionColor
          }}
        />
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: conditionColor }}
        >
          {conditionLabel}
        </Typography>
      </Box>

      {/* Stats */}
      {data.medianPrice !== null && (
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}
        >
          <Typography variant="body2" color="text.secondary">
            Median Price
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            ${data.medianPrice.toLocaleString()}
          </Typography>
        </Box>
      )}

      {data.avgDom !== null && (
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}
        >
          <Typography variant="body2" color="text.secondary">
            Avg Days on Market
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {Math.round(data.avgDom)}
          </Typography>
        </Box>
      )}

      {data.activeCount !== null && (
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}
        >
          <Typography variant="body2" color="text.secondary">
            Active Listings
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {data.activeCount.toLocaleString()}
          </Typography>
        </Box>
      )}

      {data.yoyChange !== null && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1
          }}
        >
          <Typography variant="body2" color="text.secondary">
            YoY Price Change
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {data.yoyChange >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />
            )}
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: data.yoyChange >= 0 ? '#4caf50' : '#f44336' }}
            >
              {data.yoyChange >= 0 ? '+' : ''}
              {data.yoyChange.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      )}

      {/* Mini trend line */}
      {trendSvg && (
        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
          {trendSvg}
        </Box>
      )}

      {/* Link */}
      <Typography
        component="a"
        href={`/${citySlug}`}
        variant="body2"
        sx={{
          color: 'primary.main',
          textDecoration: 'none',
          fontWeight: 600,
          '&:hover': { textDecoration: 'underline' }
        }}
      >
        View Full Market Report &rarr;
      </Typography>
    </Box>
  )
}
