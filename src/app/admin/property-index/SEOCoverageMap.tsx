'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'

import APIAIContent, { type CityLocation } from '@/services/API/APIAIContent'
import APIContentPages, { type ContentPage } from '@/services/API/APIContentPages'
import { subTypes, targetCounties } from '@configs/page-generation'
import { displayNameToSlug } from 'utils/templateEngine'

type CoverageStatus = 'published' | 'draft' | 'missing'

interface CoverageCell {
  status: CoverageStatus
  pageId?: string
  pageSlug?: string
}

interface MissingCombo {
  city: string
  county: string
  subtypeSlug: string
  subtypeLabel: string
}

const STORAGE_KEY = 'bulk-pages.prefill'

function statusBg(status: CoverageStatus): string {
  switch (status) {
    case 'published':
      return 'success.main'
    case 'draft':
      return 'warning.main'
    case 'missing':
    default:
      return 'error.light'
  }
}

function statusFg(status: CoverageStatus): string {
  switch (status) {
    case 'published':
      return 'success.contrastText'
    case 'draft':
      return 'warning.contrastText'
    case 'missing':
    default:
      return 'error.contrastText'
  }
}

export default function SEOCoverageMap() {
  const router = useRouter()
  const [cities, setCities] = useState<CityLocation[]>([])
  const [pages, setPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [cityList, pageResp] = await Promise.all([
          APIAIContent.getLocationCities(),
          APIContentPages.getPages({ is_template: false }),
        ])
        if (cancelled) return
        setCities(cityList)
        setPages(pageResp.pages)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load coverage data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Build a lookup: `${citySlug}/${subtypeSlug}` -> ContentPage
  const pageBySlug = useMemo(() => {
    const map = new Map<string, ContentPage>()
    for (const p of pages) {
      if (!p.slug) continue
      map.set(p.slug, p)
    }
    return map
  }, [pages])

  // Group cities by county, alphabetised within each county.
  const citiesByCounty = useMemo(() => {
    const grouped: Record<string, CityLocation[]> = {}
    for (const county of targetCounties) grouped[county] = []
    for (const c of cities) {
      if ((targetCounties as readonly string[]).includes(c.county)) {
        grouped[c.county].push(c)
      }
    }
    for (const county of targetCounties) {
      grouped[county].sort((a, b) => a.name.localeCompare(b.name))
    }
    return grouped
  }, [cities])

  // Compute coverage matrix and aggregate counts.
  const { coverage, totals, missing } = useMemo(() => {
    const cov = new Map<string, CoverageCell>()
    let published = 0
    let draft = 0
    let missingCount = 0
    const missingList: MissingCombo[] = []
    for (const county of targetCounties) {
      for (const city of citiesByCounty[county] || []) {
        const citySlug = displayNameToSlug(city.name)
        for (const st of subTypes) {
          const slug = `${citySlug}/${st.slug}`
          const page = pageBySlug.get(slug)
          let status: CoverageStatus = 'missing'
          if (page) {
            status = page.status === 'published' ? 'published' : 'draft'
          }
          cov.set(`${city.id}|${st.slug}`, {
            status,
            pageId: page?.id,
            pageSlug: page?.slug,
          })
          if (status === 'published') published += 1
          else if (status === 'draft') draft += 1
          else {
            missingCount += 1
            missingList.push({
              city: city.name,
              county: city.county,
              subtypeSlug: st.slug,
              subtypeLabel: st.label,
            })
          }
        }
      }
    }
    const total =
      Object.values(citiesByCounty).reduce((acc, list) => acc + list.length, 0) *
      subTypes.length
    return {
      coverage: cov,
      totals: { total, published, draft, missing: missingCount },
      missing: missingList,
    }
  }, [citiesByCounty, pageBySlug])

  const coveragePct =
    totals.total > 0 ? Math.round((totals.published / totals.total) * 100) : 0

  const handleGenerateMissing = () => {
    if (missing.length === 0) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(missing))
    } catch {
      // ignore - prefill is a nice-to-have
    }
    router.push('/admin/bulk-pages?prefill=seo-coverage')
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  const hasAnyCity = Object.values(citiesByCounty).some((l) => l.length > 0)
  if (!hasAnyCity) {
    return (
      <Alert severity="info">
        No cities returned from the locations API for Broward or Palm Beach.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header / summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">
              {totals.published} of {totals.total} possible pages published (
              {coveragePct}%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coverage across {Object.values(citiesByCounty).reduce(
                (acc, l) => acc + l.length,
                0
              )}{' '}
              cities × {subTypes.length} property subtypes.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Stack direction="row" spacing={2}>
              <CountChip color="success.main" label="Published" value={totals.published} />
              <CountChip color="warning.main" label="Draft" value={totals.draft} />
              <CountChip color="error.light" label="Missing" value={totals.missing} />
            </Stack>
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              disabled={missing.length === 0}
              onClick={handleGenerateMissing}
            >
              Generate Missing ({missing.length})
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Legend */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
        <LegendSwatch color="success.main" label="Published — view live" />
        <LegendSwatch color="warning.main" label="Draft — open in editor" />
        <LegendSwatch color="error.light" label="Missing — not yet generated" />
      </Stack>

      {/* Matrix */}
      <Paper variant="outlined" sx={{ overflow: 'auto', maxWidth: '100%' }}>
        <Box sx={{ minWidth: 'fit-content' }}>
          {/* Header row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `220px repeat(${subTypes.length}, minmax(64px, 1fr))`,
              position: 'sticky',
              top: 0,
              bgcolor: 'background.paper',
              zIndex: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                p: 1.5,
                position: 'sticky',
                left: 0,
                bgcolor: 'background.paper',
                zIndex: 3,
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                City
              </Typography>
            </Box>
            {subTypes.map((st) => (
              <Tooltip key={st.slug} title={st.label} placement="top">
                <Box
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      lineHeight: 1.2,
                    }}
                  >
                    {st.label}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Rows grouped by county */}
          {targetCounties.map((county) => {
            const list = citiesByCounty[county] || []
            if (list.length === 0) return null
            return (
              <Box key={county}>
                <Box
                  sx={{
                    p: 1,
                    pl: 2,
                    bgcolor: 'grey.100',
                    borderTop: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    left: 0,
                  }}
                >
                  <Typography variant="overline" fontWeight={700}>
                    {county} County · {list.length} cities
                  </Typography>
                </Box>
                {list.map((city) => (
                  <Box
                    key={city.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `220px repeat(${subTypes.length}, minmax(64px, 1fr))`,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.25,
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 1,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {city.name}
                      </Typography>
                    </Box>
                    {subTypes.map((st) => {
                      const cell = coverage.get(`${city.id}|${st.slug}`) || {
                        status: 'missing' as const,
                      }
                      const citySlug = displayNameToSlug(city.name)
                      return (
                        <CoverageCellView
                          key={st.slug}
                          cell={cell}
                          cityName={city.name}
                          citySlug={citySlug}
                          subtypeLabel={st.label}
                          subtypeSlug={st.slug}
                        />
                      )
                    })}
                  </Box>
                ))}
              </Box>
            )
          })}
        </Box>
      </Paper>
    </Box>
  )
}

function CountChip({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: number
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: '2px' }} />
      <Typography variant="body2" color="text.secondary">
        {label}: <strong>{value}</strong>
      </Typography>
    </Stack>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 16, height: 16, bgcolor: color, borderRadius: '2px' }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}

function CoverageCellView({
  cell,
  cityName,
  citySlug,
  subtypeLabel,
  subtypeSlug,
}: {
  cell: CoverageCell
  cityName: string
  citySlug: string
  subtypeLabel: string
  subtypeSlug: string
}) {
  const baseSx = {
    minHeight: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid',
    borderColor: 'divider',
    cursor: cell.status === 'missing' ? 'default' : 'pointer',
    transition: 'opacity 0.15s',
    '&:hover': cell.status === 'missing' ? {} : { opacity: 0.8 },
  } as const

  if (cell.status === 'missing') {
    return (
      <Tooltip
        title={`${cityName} · ${subtypeLabel} — Not yet generated`}
        placement="top"
      >
        <Box
          sx={{
            ...baseSx,
            bgcolor: statusBg(cell.status),
            color: statusFg(cell.status),
          }}
        >
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            +
          </Typography>
        </Box>
      </Tooltip>
    )
  }

  const isPublished = cell.status === 'published'
  const href = isPublished
    ? `/${citySlug}/${subtypeSlug}`
    : cell.pageId
      ? `/admin/content-pages/${cell.pageId}`
      : '#'

  const tooltipLabel = isPublished
    ? `${cityName} · ${subtypeLabel} — View live page`
    : `${cityName} · ${subtypeLabel} — Open draft in editor`

  return (
    <Tooltip title={tooltipLabel} placement="top">
      <Box
        component="a"
        href={href}
        target={isPublished ? '_blank' : undefined}
        rel={isPublished ? 'noopener noreferrer' : undefined}
        sx={{
          ...baseSx,
          bgcolor: statusBg(cell.status),
          color: statusFg(cell.status),
          textDecoration: 'none',
        }}
      />
    </Tooltip>
  )
}
