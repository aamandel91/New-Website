'use client'

import React, { useState, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Slider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import PreviewIcon from '@mui/icons-material/Preview'
import CampaignIcon from '@mui/icons-material/Campaign'

import { ppcFeedConfig } from '@configs/ppc-feed'
import { subTypes } from '@configs/page-generation'

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedEntry {
  'Page URL': string
  'Custom Label 1': string
  'Custom Label 2': string
  'Custom Label 3': string
  'Custom Label 4': string
}

interface FeedMeta {
  total: number
  byType: Record<string, number>
  byCity: Record<string, number>
  byPriceTier: Record<string, number>
  generated_at: string
  cached: boolean
}

interface FeedResponse {
  data: FeedEntry[]
  meta: FeedMeta
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PPCFeedsPage() {
  // Config state
  const [minAvgPrice, setMinAvgPrice] = useState(ppcFeedConfig.minAvgPrice)
  const [minListings, setMinListings] = useState(ppcFeedConfig.minListings)
  const [excludedSubTypes, setExcludedSubTypes] = useState<Set<string>>(
    new Set(ppcFeedConfig.excludeSubTypes)
  )
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    new Set(ppcFeedConfig.targetAreas)
  )

  // Feed data state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedData, setFeedData] = useState<FeedResponse | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const toggleSubType = (slug: string) => {
    setExcludedSubTypes((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(area)) next.delete(area)
      else next.add(area)
      return next
    })
  }

  const fetchPreview = useCallback(
    async (refresh = false) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          format: 'json',
          type: 'pages',
          minAvgPrice: String(minAvgPrice),
          minListings: String(minListings),
        })
        if (refresh) params.set('refresh', 'true')

        const res = await fetch(`/api/feed/ppc-page-feed?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as FeedResponse
        setFeedData(json)
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch feed')
      } finally {
        setLoading(false)
      }
    },
    [minAvgPrice, minListings]
  )

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = async (type: 'pages' | 'customizers') => {
    const params = new URLSearchParams({
      format: 'csv',
      type,
      minAvgPrice: String(minAvgPrice),
      minListings: String(minListings),
    })
    window.open(`/api/feed/ppc-page-feed?${params.toString()}`, '_blank')
  }

  // Build feed URLs for display
  const baseFeedUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const pageFeedUrl = `${baseFeedUrl}/api/feed/ppc-page-feed?format=csv&type=pages&minAvgPrice=${minAvgPrice}&minListings=${minListings}`
  const customizerFeedUrl = `${baseFeedUrl}/api/feed/ppc-page-feed?format=csv&type=customizers&minAvgPrice=${minAvgPrice}&minListings=${minListings}`

  // Filter preview data by excluded sub-types
  const filteredData = feedData?.data.filter((entry) => {
    if (entry['Custom Label 1'] === 'subType') {
      const stSlug = subTypes.find((s) => s.label === entry['Custom Label 3'])?.slug
      if (stSlug && excludedSubTypes.has(stSlug)) return false
    }
    if (!selectedAreas.has('Broward') && !selectedAreas.has('Palm Beach')) return false
    return true
  })

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <CampaignIcon sx={{ color: '#C4A96E', fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            PPC Feeds
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Generate and manage page feeds for Google Dynamic Search Ad campaigns.
          Only high-value pages (by avg price and listing count) are included.
        </Typography>

        <Grid container spacing={3}>
          {/* ── Left: Config Controls ── */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Price slider */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Min Avg Price
                </Typography>
                <Slider
                  value={minAvgPrice}
                  onChange={(_, v) => setMinAvgPrice(v as number)}
                  min={100000}
                  max={3000000}
                  step={50000}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) =>
                    v >= 1000000
                      ? `$${(v / 1000000).toFixed(1)}M`
                      : `$${(v / 1000).toFixed(0)}K`
                  }
                  marks={[
                    { value: 500000, label: '$500K' },
                    { value: 1000000, label: '$1M' },
                    { value: 2000000, label: '$2M' },
                  ]}
                />
                <Typography variant="body2" color="text.secondary">
                  Current: {minAvgPrice >= 1000000 ? `$${(minAvgPrice / 1000000).toFixed(1)}M` : `$${(minAvgPrice / 1000).toFixed(0)}K`}
                </Typography>
              </Paper>

              {/* Listings slider */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Min Listings
                </Typography>
                <Slider
                  value={minListings}
                  onChange={(_, v) => setMinListings(v as number)}
                  min={1}
                  max={50}
                  step={1}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 5, label: '5' },
                    { value: 15, label: '15' },
                    { value: 30, label: '30' },
                  ]}
                />
                <Typography variant="body2" color="text.secondary">
                  Current: {minListings} listings
                </Typography>
              </Paper>

              {/* Target Areas */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Target Areas
                </Typography>
                <FormGroup>
                  {ppcFeedConfig.targetAreas.map((area) => (
                    <FormControlLabel
                      key={area}
                      control={
                        <Checkbox
                          checked={selectedAreas.has(area)}
                          onChange={() => toggleArea(area)}
                          size="small"
                        />
                      }
                      label={area}
                    />
                  ))}
                </FormGroup>
              </Paper>

              {/* Sub-type exclusions */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Excluded Sub-Types
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Checked sub-types are excluded from the feed.
                </Typography>
                <FormGroup>
                  {subTypes.map((st) => (
                    <FormControlLabel
                      key={st.slug}
                      control={
                        <Checkbox
                          checked={excludedSubTypes.has(st.slug)}
                          onChange={() => toggleSubType(st.slug)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {st.label}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Stack>
          </Grid>

          {/* ── Right: Preview & Feed URLs ── */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Actions */}
              <Paper sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PreviewIcon />}
                    onClick={() => fetchPreview(false)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Generate Preview'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchPreview(true)}
                    disabled={loading}
                  >
                    Refresh (Bypass Cache)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload('pages')}
                    disabled={!feedData}
                  >
                    Download Page Feed CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload('customizers')}
                    disabled={!feedData}
                  >
                    Download Customizer CSV
                  </Button>
                </Stack>
              </Paper>

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Feed URLs */}
              {feedData && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Feed URLs for Google Ads
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Page Feed (for DSA)
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          value={pageFeedUrl}
                          slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
                        />
                        <Tooltip title={copied === 'page' ? 'Copied!' : 'Copy'}>
                          <IconButton onClick={() => handleCopy(pageFeedUrl, 'page')} size="small">
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Ad Customizer Feed
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          value={customizerFeedUrl}
                          slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
                        />
                        <Tooltip title={copied === 'customizer' ? 'Copied!' : 'Copy'}>
                          <IconButton onClick={() => handleCopy(customizerFeedUrl, 'customizer')} size="small">
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Stats */}
              {feedData && (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {feedData.meta.total}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Pages
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {feedData.meta.byType.subType ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sub-Type Pages
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {feedData.meta.byType.neighborhood ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Neighborhood Pages
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {Object.keys(feedData.meta.byCity).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cities
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* By City breakdown */}
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          By City
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {Object.entries(feedData.meta.byCity)
                            .sort(([, a], [, b]) => b - a)
                            .map(([city, count]) => (
                              <Chip
                                key={city}
                                label={`${city}: ${count}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* By Price Tier breakdown */}
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          By Price Tier
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {Object.entries(feedData.meta.byPriceTier)
                            .filter(([, count]) => count > 0)
                            .map(([tier, count]) => (
                              <Chip
                                key={tier}
                                label={`${tier}: ${count}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Preview table */}
              {feedData && filteredData && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Qualifying Pages ({filteredData.length})
                  </Typography>
                  {feedData.meta.cached && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Showing cached data from {new Date(feedData.meta.generated_at).toLocaleString()}.
                      Click &quot;Refresh&quot; to regenerate.
                    </Alert>
                  )}
                  <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Page URL</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>City</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Price Tier</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredData.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row['Page URL']}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row['Custom Label 1']}
                                size="small"
                                color={row['Custom Label 1'] === 'subType' ? 'primary' : 'secondary'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{row['Custom Label 2']}</TableCell>
                            <TableCell>{row['Custom Label 3']}</TableCell>
                            <TableCell>
                              <Chip label={row['Custom Label 4']} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}
