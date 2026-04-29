'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import APIAIContent, {
  type CityLocation,
  type KeywordQueueRow,
  type KeywordQueueStatus
} from '@/services/API/APIAIContent'

const DEFAULT_TARGET_CITIES = [
  'Boca Raton',
  'Parkland',
  'Coral Springs',
  'Delray Beach',
  'Boynton Beach',
  'Pompano Beach',
  'Fort Lauderdale'
] as const

const KEYWORD_TEMPLATES = [
  'homes for sale [city]',
  'condos for sale [city]',
  'waterfront homes [city]',
  'schools in [city]',
  'cost of living [city]',
  'moving to [city] Florida',
  'best neighborhoods [city]'
] as const

interface SuggestedKeyword {
  key: string
  keyword: string
  city: string
}

const SUGGESTED_KEYWORDS: SuggestedKeyword[] = DEFAULT_TARGET_CITIES.flatMap(city =>
  KEYWORD_TEMPLATES.map(tpl => ({
    key: `${city}|${tpl}`,
    keyword: tpl.replace('[city]', city),
    city
  }))
)

const STATUS_COLORS: Record<KeywordQueueStatus, 'default' | 'info' | 'success' | 'error'> = {
  pending: 'default',
  generating: 'info',
  done: 'success',
  failed: 'error'
}

export default function KeywordQueueTab() {
  const [cities, setCities] = useState<CityLocation[]>([])
  const [rows, setRows] = useState<KeywordQueueRow[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<string | null>(null)

  // Add Keywords form
  const [keywordsText, setKeywordsText] = useState('')
  const [addCity, setAddCity] = useState('')
  const [priority, setPriority] = useState(0)
  const [adding, setAdding] = useState(false)

  // Suggested keywords
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())

  // Filters
  const [filterStatus, setFilterStatus] = useState<KeywordQueueStatus | ''>('')
  const [filterCity, setFilterCity] = useState('')
  const [search, setSearch] = useState('')

  // Process
  const [processCount, setProcessCount] = useState(5)
  const [processing, setProcessing] = useState(false)

  const refresh = async () => {
    setLoadingList(true)
    try {
      const filters: { status?: KeywordQueueStatus; city?: string } = {}
      if (filterStatus) filters.status = filterStatus
      if (filterCity) filters.city = filterCity
      const items = await APIAIContent.listKeywordQueue(filters)
      setRows(items)
    } catch (err: any) {
      setError(err?.message || 'Failed to load queue')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    APIAIContent.getLocationCities()
      .then(setCities)
      .catch(() => setCities([]))
  }, [])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterCity])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const s = search.trim().toLowerCase()
    return rows.filter(r => r.keyword.toLowerCase().includes(s))
  }, [rows, search])

  const handleAddManual = async () => {
    const lines = keywordsText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      setError('Enter at least one keyword')
      return
    }
    setAdding(true)
    setError(null)
    try {
      const items = lines.map(keyword => ({
        keyword,
        ...(addCity ? { city: addCity } : {}),
        priority
      }))
      await APIAIContent.addKeywordsToQueue(items)
      setSnack(`Added ${lines.length} keyword${lines.length === 1 ? '' : 's'} to queue`)
      setKeywordsText('')
      await refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to add keywords')
    } finally {
      setAdding(false)
    }
  }

  const handleAddSelectedSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      setError('Select at least one suggested keyword')
      return
    }
    const items = SUGGESTED_KEYWORDS
      .filter(s => selectedSuggestions.has(s.key))
      .map(s => ({ keyword: s.keyword, city: s.city, priority: 0 }))
    setAdding(true)
    setError(null)
    try {
      await APIAIContent.addKeywordsToQueue(items)
      setSnack(`Added ${items.length} suggested keyword${items.length === 1 ? '' : 's'}`)
      setSelectedSuggestions(new Set())
      await refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to add keywords')
    } finally {
      setAdding(false)
    }
  }

  const toggleSuggestion = (key: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedSuggestions.size === SUGGESTED_KEYWORDS.length) {
      setSelectedSuggestions(new Set())
    } else {
      setSelectedSuggestions(new Set(SUGGESTED_KEYWORDS.map(s => s.key)))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await APIAIContent.deleteKeywordQueueEntry(id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err?.message || 'Failed to delete entry')
    }
  }

  const handleProcess = async () => {
    setProcessing(true)
    setError(null)
    try {
      const result = await APIAIContent.processKeywordQueue(processCount)
      setSnack(
        `Generated ${result.succeeded} of ${result.processed}` +
          (result.failed > 0 ? ` (${result.failed} failed)` : '')
      )
      await refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to process queue')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Stack spacing={3}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add Keywords */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add Keywords
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Keywords (one per line)"
                multiline
                minRows={4}
                fullWidth
                value={keywordsText}
                onChange={e => setKeywordsText(e.target.value)}
                placeholder={'homes for sale Boca Raton\nschools in Parkland\n...'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>City (applies to all)</InputLabel>
                  <Select
                    value={addCity}
                    label="City (applies to all)"
                    onChange={e => setAddCity(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {cities.map(c => (
                      <MenuItem key={c.id} value={c.name}>
                        {c.name} ({c.county})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Priority"
                  type="number"
                  fullWidth
                  value={priority}
                  onChange={e => setPriority(Number(e.target.value) || 0)}
                  helperText="Higher = generated first"
                />
                <Button
                  variant="contained"
                  onClick={handleAddManual}
                  disabled={adding || !keywordsText.trim()}
                >
                  {adding ? <CircularProgress size={20} /> : 'Add to Queue'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Suggested Keywords */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Suggested Keywords ({SUGGESTED_KEYWORDS.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button size="small" onClick={toggleSelectAll}>
                {selectedSuggestions.size === SUGGESTED_KEYWORDS.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleAddSelectedSuggestions}
                disabled={adding || selectedSuggestions.size === 0}
              >
                Add Selected to Queue ({selectedSuggestions.size})
              </Button>
            </Stack>
            <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
              <Grid container spacing={1}>
                {SUGGESTED_KEYWORDS.map(s => (
                  <Grid item xs={12} sm={6} md={4} key={s.key}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ p: 0.5 }}
                    >
                      <Checkbox
                        size="small"
                        checked={selectedSuggestions.has(s.key)}
                        onChange={() => toggleSuggestion(s.key)}
                      />
                      <Box>
                        <Typography variant="body2">{s.keyword}</Typography>
                        <Chip label={s.city} size="small" variant="outlined" />
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Process panel */}
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ flexShrink: 0 }}>
              Process Queue
            </Typography>
            <TextField
              label="Generate next ___ keywords"
              type="number"
              size="small"
              value={processCount}
              onChange={e => {
                const n = Number(e.target.value) || 1
                setProcessCount(Math.max(1, Math.min(20, n)))
              }}
              inputProps={{ min: 1, max: 20 }}
              sx={{ width: 240 }}
            />
            <Button
              variant="contained"
              startIcon={processing ? <CircularProgress size={18} /> : <PlayArrowIcon />}
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? 'Processing…' : 'Process Queue'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              Max 20 per run. Each keyword generates a full draft blog post.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Queue ({filteredRows.length})
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value as KeywordQueueStatus | '')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="generating">Generating</MenuItem>
                <MenuItem value="done">Done</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>City</InputLabel>
              <Select
                value={filterCity}
                label="City"
                onChange={e => setFilterCity(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {cities.map(c => (
                  <MenuItem key={c.id} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Search keyword"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Button size="small" onClick={refresh} disabled={loadingList}>
              Refresh
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Keyword</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell align="right">Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Blog Post</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingList && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                )}
                {!loadingList && filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Queue is empty
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {filteredRows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.keyword}</TableCell>
                    <TableCell>{row.city || '—'}</TableCell>
                    <TableCell align="right">{row.priority}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        color={STATUS_COLORS[row.status]}
                      />
                    </TableCell>
                    <TableCell>
                      {row.blog_post_id ? (
                        <MuiLink
                          href={`/admin/blog/${row.blog_post_id}/edit`}
                          underline="hover"
                        >
                          #{row.blog_post_id}
                        </MuiLink>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={row.notes ? row.notes : 'Delete'}
                        placement="left"
                      >
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(row.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar
        open={snack !== null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack || ''}
      />
    </Stack>
  )
}
