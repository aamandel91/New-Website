'use client'

import React, { useCallback, useEffect, useState } from 'react'

import GridViewIcon from '@mui/icons-material/GridView'
import MapIcon from '@mui/icons-material/Map'
import RefreshIcon from '@mui/icons-material/Refresh'
import StorageIcon from '@mui/icons-material/Storage'
import SyncIcon from '@mui/icons-material/Sync'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from '@mui/material'

import SEOCoverageMap from './SEOCoverageMap'

interface IndexEntry {
  slug: string
  status: string
  lastUpdated: string
  score: number
  indexDirective: string
  mlsNumber?: string
  soldPrice?: number
  soldDate?: string
}

interface IndexStats {
  total: number
  active: number
  sold: number
  pending: number
  offMarket: number
  indexed: number
  noindexFollow: number
  noindexNofollow: number
}

interface AreaScoreEntry {
  url: string
  pageType: 'city' | 'subType'
  city: string
  subType?: string
  listingCount: number
  score: number
  indexDirective: string
}

function computeStats(entries: IndexEntry[]): IndexStats {
  return {
    total: entries.length,
    active: entries.filter((e) => e.status === 'active').length,
    sold: entries.filter((e) => e.status === 'sold').length,
    pending: entries.filter((e) => e.status === 'pending').length,
    offMarket: entries.filter((e) => e.status === 'off-market').length,
    indexed: entries.filter((e) => e.score >= 3).length,
    noindexFollow: entries.filter((e) => e.score >= 1 && e.score < 3).length,
    noindexNofollow: entries.filter((e) => e.score < 1).length
  }
}

const GOLD = '#C4A96E'

export default function PropertyIndexPage() {
  const [tab, setTab] = useState(0)
  const [entries, setEntries] = useState<IndexEntry[]>([])
  const [stats, setStats] = useState<IndexStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Area pages state
  const [areaEntries, setAreaEntries] = useState<AreaScoreEntry[]>([])
  const [areaLoading, setAreaLoading] = useState(false)
  const [areaLoaded, setAreaLoaded] = useState(false)

  const loadIndex = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/backfill?county=__stats_only__')
      if (!res.ok) throw new Error('Failed to load')
    } catch {
      // ignore - stats will be empty
    }

    try {
      const res = await fetch('/api/admin/property-index')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
        setStats(computeStats(data.entries || []))
      }
    } catch {
      setEntries([])
      setStats(computeStats([]))
    }
    setLoading(false)
  }, [])

  const loadAreaScores = useCallback(async () => {
    setAreaLoading(true)
    try {
      const res = await fetch('/api/admin/area-scores')
      if (res.ok) {
        const data = await res.json()
        setAreaEntries(data.entries || [])
      }
    } catch {
      setAreaEntries([])
    }
    setAreaLoading(false)
    setAreaLoaded(true)
  }, [])

  useEffect(() => {
    loadIndex()
  }, [loadIndex])

  // Load area scores when tab is first selected
  useEffect(() => {
    if (tab === 1 && !areaLoaded && !areaLoading) {
      loadAreaScores()
    }
  }, [tab, areaLoaded, areaLoading, loadAreaScores])

  const runBackfill = async () => {
    setBackfillLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/backfill?county=Broward&months=24')
      const data = await res.json()
      if (res.ok) {
        setMessage(
          `Backfill complete: ${data.fetched} fetched, ${data.total} total indexed. ` +
            `${data.indexed} index-worthy, ${data.noindexFollow} noindex/follow, ${data.noindexNofollow} noindex/nofollow.`
        )
        await loadIndex()
      } else {
        setMessage(`Error: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      setMessage(`Error: ${String(err)}`)
    }
    setBackfillLoading(false)
  }

  const runSync = async () => {
    setSyncLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/cron/property-sync?secret=admin-ui')
      const data = await res.json()
      if (res.ok) {
        setMessage(
          `Sync complete: ${data.newEntries} new entries processed. ` +
            `${data.activeFound} active, ${data.soldFound} recently sold. ${data.total} total.`
        )
        await loadIndex()
      } else {
        setMessage(`Error: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      setMessage(`Error: ${String(err)}`)
    }
    setSyncLoading(false)
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price)
  }

  const scoreColor = (score: number) => {
    if (score >= 3) return 'success'
    if (score >= 1) return 'warning'
    return 'error'
  }

  const areaIndexed = areaEntries.filter((e) => e.score >= 3).length
  const areaNoindexFollow = areaEntries.filter(
    (e) => e.score >= 1 && e.score < 3
  ).length
  const areaNoindexNofollow = areaEntries.filter((e) => e.score < 1).length

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Property Index
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage the property page index used for sitemap generation and crawl
        budget optimization.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Property Pages" />
        <Tab
          label="Area Pages"
          icon={<MapIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
        />
        <Tab
          label="SEO Coverage"
          icon={<GridViewIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
        />
      </Tabs>

      {/* ─── Property Pages Tab ─── */}
      {tab === 0 && (
        <>
          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={
                backfillLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <StorageIcon />
                )
              }
              onClick={runBackfill}
              disabled={backfillLoading}
              sx={{ bgcolor: GOLD, '&:hover': { bgcolor: '#b09860' } }}
            >
              Run Backfill
            </Button>
            <Button
              variant="outlined"
              startIcon={
                syncLoading ? <CircularProgress size={18} /> : <SyncIcon />
              }
              onClick={runSync}
              disabled={syncLoading}
            >
              Run Daily Sync
            </Button>
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={loadIndex}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {message && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="body2">{message}</Typography>
            </Paper>
          )}

          {/* Stats */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="success.main"
                  >
                    {stats.indexed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Index-worthy
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="warning.main"
                  >
                    {stats.noindexFollow}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Noindex/Follow
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {stats.noindexNofollow}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Noindex/Nofollow
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {stats.active}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.sold}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sold
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell>Directive</TableCell>
                    <TableCell>Sold Price</TableCell>
                    <TableCell>Sold Date</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No entries yet. Run a backfill to populate the index.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.slice(0, 100).map((entry) => (
                      <TableRow key={entry.slug} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            component="a"
                            href={`/homes/${entry.slug}`}
                            target="_blank"
                            sx={{
                              textDecoration: 'none',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {entry.slug.replace(/-/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.status}
                            size="small"
                            color={
                              entry.status === 'active'
                                ? 'success'
                                : entry.status === 'sold'
                                  ? 'error'
                                  : entry.status === 'pending'
                                    ? 'warning'
                                    : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={entry.score}
                            size="small"
                            color={scoreColor(entry.score) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {entry.indexDirective}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatPrice(entry.soldPrice)}</TableCell>
                        <TableCell>
                          {entry.soldDate
                            ? new Date(entry.soldDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {entry.lastUpdated
                            ? new Date(entry.lastUpdated).toLocaleDateString()
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {entries.length > 100 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: 'center' }}
            >
              Showing 100 of {entries.length} entries
            </Typography>
          )}
        </>
      )}

      {/* ─── Area Pages Tab ─── */}
      {tab === 1 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Button
              variant="text"
              startIcon={
                areaLoading ? <CircularProgress size={18} /> : <RefreshIcon />
              }
              onClick={loadAreaScores}
              disabled={areaLoading}
            >
              Refresh
            </Button>
            <Typography variant="body2" color="text.secondary">
              Scores for city and sub-type area pages across target counties.
            </Typography>
          </Box>

          {/* Area Stats */}
          {areaLoaded && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {areaEntries.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="success.main"
                  >
                    {areaIndexed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Indexed
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="warning.main"
                  >
                    {areaNoindexFollow}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Noindex/Follow
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {areaNoindexNofollow}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Noindex/Nofollow
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Area Table */}
          {areaLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell>Page Type</TableCell>
                    <TableCell>Listing Count</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell>Index Directive</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areaEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {areaLoaded
                            ? 'No area pages found.'
                            : 'Click Refresh to load area page scores.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    areaEntries.map((entry) => (
                      <TableRow key={entry.url} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            component="a"
                            href={entry.url}
                            target="_blank"
                            sx={{
                              textDecoration: 'none',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {entry.url}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.pageType}
                            size="small"
                            color={
                              entry.pageType === 'city' ? 'primary' : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {entry.listingCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={entry.score}
                            size="small"
                            color={scoreColor(entry.score) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {entry.indexDirective}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ─── SEO Coverage Tab ─── */}
      {tab === 2 && <SEOCoverageMap />}
    </Box>
  )
}
