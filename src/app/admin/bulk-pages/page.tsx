'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField
} from '@mui/material'
import BulkIcon from '@mui/icons-material/LibraryAdd'
import CheckIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import APIAIContent, {
  type BulkPagePreview,
  type BulkPageGenerationResult,
  type CityLocation,
  type ZipLocation,
  type NeighborhoodLocation
} from '@/services/API/APIAIContent'

const PAGE_TYPES = [
  { value: 'city', label: 'City Pages', example: 'Real Estate in Miami' },
  { value: 'zipcode', label: 'Zip Code Pages', example: 'Homes for Sale in 33101' },
  { value: 'neighborhood', label: 'Neighborhood Pages', example: 'Downtown Miami Homes' },
  { value: 'property_type', label: 'Property Type Pages', example: 'Condos for Sale' }
]

const PROPERTY_TYPES = [
  { id: 1, name: 'Single Family Homes' },
  { id: 2, name: 'Condos' },
  { id: 3, name: 'Townhomes' },
  { id: 4, name: 'Multi-Family' },
  { id: 5, name: 'Land' },
  { id: 6, name: 'Commercial' },
  { id: 7, name: 'Luxury Homes' },
  { id: 8, name: 'New Construction' }
]

export default function BulkPagesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [pageType, setPageType] = useState<string>('city')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [autoPublish, setAutoPublish] = useState(false)
  const [useTemplate, setUseTemplate] = useState(false)
  const [template, setTemplate] = useState('')

  // Preview and results
  const [preview, setPreview] = useState<BulkPagePreview[]>([])
  const [generationResult, setGenerationResult] = useState<BulkPageGenerationResult | null>(null)

  // Live data from Repliers Locations API — fetched on demand by pageType.
  const [cities, setCities] = useState<CityLocation[]>([])
  const [zipcodes, setZipcodes] = useState<ZipLocation[]>([])
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodLocation[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  // Filter for the neighborhoods picker — narrows by parent city.
  const [neighborhoodCityFilter, setNeighborhoodCityFilter] = useState<string>('')
  // Free-text filter to search the visible list.
  const [filterText, setFilterText] = useState('')

  // Reset all selection state whenever the page type changes.
  const resetSelection = () => {
    setPreview([])
    setSelectedIds([])
    setFilterText('')
  }

  // Load the appropriate location list when pageType changes (and on mount).
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (pageType === 'property_type') return
      try {
        setLocationsLoading(true)
        if (pageType === 'city') {
          const list = await APIAIContent.getLocationCities()
          if (!cancelled) setCities(list)
        } else if (pageType === 'zipcode') {
          const list = await APIAIContent.getLocationZipCodes()
          if (!cancelled) setZipcodes(list)
        } else if (pageType === 'neighborhood') {
          const list = await APIAIContent.getLocationNeighborhoods(
            neighborhoodCityFilter || undefined
          )
          if (!cancelled) setNeighborhoods(list)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load locations')
        }
      } finally {
        if (!cancelled) setLocationsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [pageType, neighborhoodCityFilter])

  // Make sure we have a city list available for the neighborhood city dropdown.
  useEffect(() => {
    if (pageType !== 'neighborhood') return
    if (cities.length > 0) return
    let cancelled = false
    APIAIContent.getLocationCities()
      .then((list) => {
        if (!cancelled) setCities(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load cities')
      })
    return () => {
      cancelled = true
    }
  }, [pageType, cities.length])

  // Items shown in the picker for the current pageType, after applying the
  // free-text filter.
  const visibleItems = useMemo(() => {
    const text = filterText.trim().toLowerCase()
    const matches = (haystack: string) =>
      !text || haystack.toLowerCase().includes(text)

    if (pageType === 'city') {
      return cities
        .filter((c) => matches(`${c.name} ${c.county}`))
        .map((c) => ({
          id: c.id,
          primary: c.name,
          secondary: `${c.county} County`,
        }))
    }
    if (pageType === 'zipcode') {
      return zipcodes
        .filter((z) => matches(`${z.zip} ${z.city} ${z.county}`))
        .map((z) => ({
          id: z.id,
          primary: z.zip,
          secondary: `${z.city}, ${z.county} County`,
        }))
    }
    if (pageType === 'neighborhood') {
      return neighborhoods
        .filter((n) => matches(`${n.name} ${n.city}`))
        .map((n) => ({
          id: n.id,
          primary: n.name,
          secondary: `${n.city}, ${n.county} County`,
        }))
    }
    return []
  }, [pageType, cities, zipcodes, neighborhoods, filterText])

  const handleToggleId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAllVisible = () => {
    const visibleIds = visibleItems.map((it) => it.id)
    const allSelected = visibleIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handlePreview = async () => {
    if (selectedIds.length === 0) {
      setError(`Please select at least one ${pageType.replace('_', ' ')}`)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setPreview([])

      const previewData = await APIAIContent.previewBulkPages({
        pageType: pageType as any,
        selectedIds,
        template: useTemplate ? template : undefined,
        autoPublish
      })

      setPreview(previewData)
    } catch (err: any) {
      setError(err?.message || 'Failed to preview pages')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (preview.length === 0) {
      setError('Please preview pages first')
      return
    }

    if (!confirm(`Generate ${preview.length} pages? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setGenerationResult(null)

      const result = await APIAIContent.generateBulkPages({
        pageType: pageType as any,
        selectedIds,
        template: useTemplate ? template : undefined,
        autoPublish
      })

      setGenerationResult(result)
      setSuccess(`Successfully generated ${result.generated} pages!`)
      setPreview([])
      setSelectedIds([])
      setFilterText('')
    } catch (err: any) {
      setError(err?.message || 'Failed to generate pages')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bulk Page Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Generate multiple SEO-optimized pages at once
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Configuration */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Page Type</InputLabel>
                  <Select
                    value={pageType}
                    label="Page Type"
                    onChange={(e) => {
                      setPageType(e.target.value)
                      resetSelection()
                    }}
                  >
                    {PAGE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Alert severity="info">
                  Example: {PAGE_TYPES.find((t) => t.value === pageType)?.example}
                </Alert>

                {pageType === 'property_type' ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Property Types
                    </Typography>
                    <List>
                      {PROPERTY_TYPES.map((pt) => (
                        <ListItem key={pt.id} dense disablePadding>
                          <ListItemButton
                            dense
                            onClick={() => handleToggleId(pt.id)}
                          >
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={selectedIds.includes(pt.id)}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemText primary={pt.name} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2">
                        {pageType === 'city' && 'Select Cities'}
                        {pageType === 'zipcode' && 'Select Zip Codes'}
                        {pageType === 'neighborhood' && 'Select Neighborhoods'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedIds.length} selected
                      </Typography>
                    </Stack>

                    {pageType === 'neighborhood' && (
                      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel>Filter by City</InputLabel>
                        <Select
                          value={neighborhoodCityFilter}
                          label="Filter by City"
                          onChange={(e) => {
                            setNeighborhoodCityFilter(e.target.value as string)
                            setSelectedIds([])
                          }}
                        >
                          <MenuItem value="">All cities</MenuItem>
                          {cities.map((c) => (
                            <MenuItem key={c.id} value={c.name}>
                              {c.name} ({c.county})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <TextField
                      placeholder="Search..."
                      size="small"
                      fullWidth
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      sx={{ mb: 1 }}
                    />

                    {locationsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : visibleItems.length === 0 ? (
                      <Alert severity="info">
                        {filterText
                          ? 'No matches — try a different search.'
                          : 'No locations available.'}
                      </Alert>
                    ) : (
                      <>
                        <Button
                          size="small"
                          onClick={handleSelectAllVisible}
                          sx={{ mb: 0.5 }}
                        >
                          {visibleItems.every((it) =>
                            selectedIds.includes(it.id)
                          )
                            ? 'Deselect visible'
                            : 'Select all visible'}
                        </Button>
                        <List
                          sx={{
                            maxHeight: 400,
                            overflow: 'auto',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                          }}
                        >
                          {visibleItems.map((item) => (
                            <ListItem key={item.id} dense disablePadding>
                              <ListItemButton
                                dense
                                onClick={() => handleToggleId(item.id)}
                              >
                                <ListItemIcon>
                                  <Checkbox
                                    edge="start"
                                    checked={selectedIds.includes(item.id)}
                                    tabIndex={-1}
                                    disableRipple
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={item.primary}
                                  secondary={item.secondary}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </Box>
                )}

                <Divider />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useTemplate}
                      onChange={(e) => setUseTemplate(e.target.checked)}
                    />
                  }
                  label="Use Custom Template"
                />

                {useTemplate && (
                  <TextField
                    label="Template"
                    fullWidth
                    multiline
                    rows={6}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="Use {{name}} for location/property name&#10;Example: Explore {{name}} real estate..."
                  />
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoPublish}
                      onChange={(e) => setAutoPublish(e.target.checked)}
                    />
                  }
                  label="Auto-publish after generation"
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handlePreview}
                    disabled={loading}
                    fullWidth
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleGenerate}
                    disabled={loading || preview.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <BulkIcon />}
                    fullWidth
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Preview / Results */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {generationResult ? 'Generation Results' : 'Preview'}
              </Typography>

              {generationResult ? (
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: 'success.light' }}>
                        <CardContent>
                          <Typography variant="h4" color="success.dark">
                            {generationResult.generated}
                          </Typography>
                          <Typography variant="body2" color="success.dark">
                            Successfully Generated
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: 'error.light' }}>
                        <CardContent>
                          <Typography variant="h4" color="error.dark">
                            {generationResult.failed}
                          </Typography>
                          <Typography variant="body2" color="error.dark">
                            Failed
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {generationResult.results.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Successfully Generated Pages
                      </Typography>
                      <List>
                        {generationResult.results.map((page) => (
                          <ListItem key={page.id}>
                            <ListItemIcon>
                              <CheckIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={page.title}
                              secondary={`/${page.slug}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {generationResult.errors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="error">
                        Failed Pages
                      </Typography>
                      <List>
                        {generationResult.errors.map((err) => (
                          <ListItem key={err.id}>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`ID: ${err.id}`}
                              secondary={err.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Stack>
              ) : preview.length > 0 ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {preview.length} pages will be generated
                  </Alert>
                  <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                    {preview.map((page, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={page.title}
                          secondary={`/${page.slug}`}
                        />
                        <Chip
                          label={autoPublish ? 'Will Publish' : 'Draft'}
                          size="small"
                          color={autoPublish ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }}
                >
                  <BulkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Configure and preview pages
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}
