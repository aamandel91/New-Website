'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Checkbox,
  FormControlLabel,
  FormGroup,
  LinearProgress,
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
  Tabs,
  Tab,
  TextField,
  IconButton,
  Autocomplete
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Publish as GenerateIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import APISearch from '@/services/API/APISearch'
import APIContentPages from '@/services/API/APIContentPages'
import type { ContentPage } from '@/services/API/APIContentPages'
import type { ApiBoardCity } from '@/services/API'
import { targetCounties, subTypes } from '@configs/page-generation'
import type { SubType } from '@configs/page-generation'
import {
  processTemplate,
  generateMetaTitle,
  generateMetaDescription,
  generateSlug
} from '@/utils/templateEngine'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CityWithCounty extends ApiBoardCity {
  county: string
}

interface PagePreviewRow {
  city: string
  county: string
  subType: SubType
  slug: string
  title: string
  status: 'pending' | 'creating' | 'created' | 'error'
  pageId?: string
  error?: string
}

interface ReplacementPair {
  find: string
  replace: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = ['Select Cities', 'Select Sub-Types', 'Preview & Generate']

const DEFAULT_TEMPLATE = `# {{subType}} in {{city}}, {{county}} County, Florida

Explore {{count}} {{subType}} currently available in {{city}}, FL. Browse the latest listings with photos, prices, and details.

## About {{subType}} in {{city}}

Looking for {{subType}} in {{city}}? Browse our comprehensive listings of properties in {{county}} County. Whether you're buying your first home or looking for an investment property, {{city}} has options for every budget.

## {{city}} Market Overview

View current market statistics and trends for {{city}}, {{county}} County, Florida.

## Explore More in {{city}}

Discover other property types and neighborhoods in {{city}}, FL.`

// ─── Component ───────────────────────────────────────────────────────────────

export default function PageGeneratorPage() {
  const [tabIndex, setTabIndex] = useState(0)

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Page Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Generate city + sub-type pages or copy existing pages to new cities
        </Typography>

        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
          <Tab label="Generate Pages" />
          <Tab label="Copy Page to Cities" />
        </Tabs>

        {tabIndex === 0 && <GenerateSection />}
        {tabIndex === 1 && <CopySection />}
      </Box>
    </Container>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Generate Section (Steps 1–3)
// ═════════════════════════════════════════════════════════════════════════════

function GenerateSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Step 1: City selection
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [countyGroups, setCountyGroups] = useState<Record<string, CityWithCounty[]>>({})
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set())

  // Step 2: Sub-type selection
  const [selectedSubTypes, setSelectedSubTypes] = useState<Set<string>>(new Set())

  // Step 3: Generation
  const [previewRows, setPreviewRows] = useState<PagePreviewRow[]>([])
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationDone, setGenerationDone] = useState(false)

  // ── Fetch locations ──
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const locations = await APISearch.fetchLocations()
        if (cancelled || !locations) return

        const groups: Record<string, CityWithCounty[]> = {}
        for (const board of locations.boards) {
          for (const cls of board.classes) {
            for (const area of cls.areas) {
              const countyName = area.name.replace(' County', '').trim()
              if (!targetCounties.some((tc) => area.name.toLowerCase().includes(tc.toLowerCase()))) {
                continue
              }
              if (!groups[countyName]) groups[countyName] = []
              for (const city of area.cities) {
                groups[countyName].push({ ...city, county: countyName })
              }
            }
          }
        }
        // Sort cities alphabetically within each county
        for (const county of Object.keys(groups)) {
          groups[county].sort((a, b) => a.name.localeCompare(b.name))
        }
        setCountyGroups(groups)
      } catch (err: any) {
        setError('Failed to load locations: ' + (err?.message || 'Unknown error'))
      } finally {
        if (!cancelled) setLoadingLocations(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── City key helper ──
  const cityKey = (city: string, county: string) => `${county}::${city}`

  // ── City selection handlers ──
  const toggleCity = (city: string, county: string) => {
    setSelectedCities((prev) => {
      const next = new Set(prev)
      const key = cityKey(city, county)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleCounty = (county: string) => {
    const cities = countyGroups[county] || []
    const allSelected = cities.every((c) => selectedCities.has(cityKey(c.name, county)))
    setSelectedCities((prev) => {
      const next = new Set(prev)
      for (const c of cities) {
        const key = cityKey(c.name, county)
        if (allSelected) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  // ── Sub-type selection handlers ──
  const toggleSubType = (slug: string) => {
    setSelectedSubTypes((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const toggleAllSubTypes = () => {
    if (selectedSubTypes.size === subTypes.length) {
      setSelectedSubTypes(new Set())
    } else {
      setSelectedSubTypes(new Set(subTypes.map((st) => st.slug)))
    }
  }

  // ── Build preview ──
  const buildPreview = useCallback(() => {
    const rows: PagePreviewRow[] = []
    for (const key of selectedCities) {
      const [county, city] = key.split('::')
      for (const slug of selectedSubTypes) {
        const st = subTypes.find((s) => s.slug === slug)!
        rows.push({
          city,
          county,
          subType: st,
          slug: generateSlug(city, county, st.slug),
          title: `${st.label} in ${city}, FL`,
          status: 'pending'
        })
      }
    }
    setPreviewRows(rows)
  }, [selectedCities, selectedSubTypes])

  // Rebuild preview when entering step 3
  useEffect(() => {
    if (activeStep === 2) buildPreview()
  }, [activeStep, buildPreview])

  // ── Page count ──
  const pageCount = selectedCities.size * selectedSubTypes.size

  // ── Generate pages ──
  const handleGenerate = async () => {
    setGenerating(true)
    setGenerationProgress(0)
    setGenerationDone(false)
    setError(null)

    const rows = [...previewRows]
    let completed = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      rows[i] = { ...row, status: 'creating' }
      setPreviewRows([...rows])

      try {
        const year = new Date().getFullYear()
        const cityData = Object.values(countyGroups)
          .flat()
          .find((c) => c.name === row.city && c.county === row.county)
        const count = cityData?.activeCount || 0

        const title = processTemplate('{{subType}} in {{city}}, {{county}} County, Florida', {
          city: row.city,
          county: row.county,
          state: 'Florida',
          stateCode: 'FL',
          subType: row.subType.label,
          subTypeSlug: row.subType.slug,
          count,
          year
        })

        const content = processTemplate(DEFAULT_TEMPLATE, {
          city: row.city,
          county: row.county,
          state: 'Florida',
          stateCode: 'FL',
          subType: row.subType.label,
          subTypeSlug: row.subType.slug,
          count,
          year
        })

        const page = await APIContentPages.createPage({
          title,
          slug: row.slug,
          meta_title: generateMetaTitle(row.city, row.subType.label, count),
          meta_description: generateMetaDescription(row.city, row.county, row.subType.label, count),
          content: {
            modules: [
              { type: 'text', data: { body: content } },
              { type: 'search-widget', data: { city: row.city, filterType: row.subType.filterType } },
              { type: 'market-stats', data: { city: row.city, county: row.county } }
            ],
            sidebar: []
          },
          status: 'draft'
        })

        rows[i] = { ...rows[i], status: 'created', pageId: page.id }
      } catch (err: any) {
        rows[i] = { ...rows[i], status: 'error', error: err?.message || 'Failed to create page' }
      }

      completed++
      setGenerationProgress(Math.round((completed / rows.length) * 100))
      setPreviewRows([...rows])
    }

    setGenerating(false)
    setGenerationDone(true)
  }

  // ── Navigation ──
  const canAdvance = () => {
    if (activeStep === 0) return selectedCities.size > 0
    if (activeStep === 1) return selectedSubTypes.size > 0
    return true
  }

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((s) => s - 1)
      setGenerationDone(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1: City Selection */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Select Cities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which cities to generate pages for. Cities are grouped by county.
          </Typography>

          {loadingLocations ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : Object.keys(countyGroups).length === 0 ? (
            <Alert severity="warning">
              No cities found for the target counties ({targetCounties.join(', ')}).
            </Alert>
          ) : (
            Object.entries(countyGroups).map(([county, cities]) => {
              const allSelected = cities.every((c) =>
                selectedCities.has(cityKey(c.name, county))
              )
              const someSelected = cities.some((c) =>
                selectedCities.has(cityKey(c.name, county))
              )

              return (
                <Box key={county} sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={() => toggleCounty(county)}
                      />
                    }
                    label={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {county} County ({cities.length} cities)
                      </Typography>
                    }
                  />
                  <FormGroup
                    sx={{
                      ml: 3,
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                        lg: '1fr 1fr 1fr 1fr'
                      },
                      gap: 0
                    }}
                  >
                    {cities.map((city) => (
                      <FormControlLabel
                        key={cityKey(city.name, county)}
                        control={
                          <Checkbox
                            checked={selectedCities.has(cityKey(city.name, county))}
                            onChange={() => toggleCity(city.name, county)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {city.name}{' '}
                            <Chip
                              label={city.activeCount}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>
              )
            })
          )}

          {selectedCities.size > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {selectedCities.size} {selectedCities.size === 1 ? 'city' : 'cities'} selected
            </Alert>
          )}
        </Box>
      )}

      {/* Step 2: Sub-Type Selection */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Select Property Sub-Types
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which property types to generate pages for each selected city.
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={selectedSubTypes.size === subTypes.length}
                indeterminate={selectedSubTypes.size > 0 && selectedSubTypes.size < subTypes.length}
                onChange={toggleAllSubTypes}
              />
            }
            label={<Typography fontWeight="bold">Select All ({subTypes.length})</Typography>}
          />

          <FormGroup
            sx={{
              ml: 3,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 0
            }}
          >
            {subTypes.map((st) => (
              <FormControlLabel
                key={st.slug}
                control={
                  <Checkbox
                    checked={selectedSubTypes.has(st.slug)}
                    onChange={() => toggleSubType(st.slug)}
                    size="small"
                  />
                }
                label={st.label}
              />
            ))}
          </FormGroup>

          {pageCount > 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              This will create <strong>{pageCount}</strong> pages ({selectedCities.size}{' '}
              {selectedCities.size === 1 ? 'city' : 'cities'} x {selectedSubTypes.size}{' '}
              {selectedSubTypes.size === 1 ? 'sub-type' : 'sub-types'})
            </Alert>
          )}
        </Box>
      )}

      {/* Step 3: Preview & Generate */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Preview & Generate
          </Typography>

          {generating && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Creating pages... {generationProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={generationProgress} />
            </Box>
          )}

          {generationDone && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Generation complete! {previewRows.filter((r) => r.status === 'created').length} of{' '}
              {previewRows.length} pages created successfully.
            </Alert>
          )}

          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>City</TableCell>
                  <TableCell>Sub-Type</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.city}</TableCell>
                    <TableCell>{row.subType.label}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      /{row.slug}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} error={row.error} />
                    </TableCell>
                    <TableCell>
                      {row.pageId && (
                        <Button
                          size="small"
                          href={`/admin/content-pages?edit=${row.pageId}`}
                          target="_blank"
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!generating && !generationDone && previewRows.length > 0 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<GenerateIcon />}
                onClick={handleGenerate}
                size="large"
              >
                Generate {previewRows.length} Pages
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          disabled={activeStep === 0 || generating}
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Back
        </Button>
        {activeStep < STEPS.length - 1 && (
          <Button
            variant="contained"
            disabled={!canAdvance() || generating}
            onClick={handleNext}
            endIcon={<NextIcon />}
          >
            Next
          </Button>
        )}
      </Box>
    </Paper>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Copy Section (Step 4)
// ═════════════════════════════════════════════════════════════════════════════

function CopySection() {
  const [error, setError] = useState<string | null>(null)

  // Source page
  const [pages, setPages] = useState<ContentPage[]>([])
  const [loadingPages, setLoadingPages] = useState(true)
  const [sourcePage, setSourcePage] = useState<ContentPage | null>(null)

  // City selection
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [countyGroups, setCountyGroups] = useState<Record<string, CityWithCounty[]>>({})
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set())

  // Replacements
  const [replacements, setReplacements] = useState<ReplacementPair[]>([])

  // Progress
  const [copying, setCopying] = useState(false)
  const [copyProgress, setCopyProgress] = useState(0)
  const [copyResults, setCopyResults] = useState<
    Array<{ city: string; status: 'created' | 'error'; pageId?: string; error?: string }>
  >([])

  // ── Load pages ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await APIContentPages.getPages()
        setPages(res.pages || [])
      } catch {
        setError('Failed to load pages')
      } finally {
        setLoadingPages(false)
      }
    }
    load()
  }, [])

  // ── Load locations ──
  useEffect(() => {
    const load = async () => {
      try {
        const locations = await APISearch.fetchLocations()
        if (!locations) return

        const groups: Record<string, CityWithCounty[]> = {}
        for (const board of locations.boards) {
          for (const cls of board.classes) {
            for (const area of cls.areas) {
              const countyName = area.name.replace(' County', '').trim()
              if (!targetCounties.some((tc) => area.name.toLowerCase().includes(tc.toLowerCase()))) {
                continue
              }
              if (!groups[countyName]) groups[countyName] = []
              for (const city of area.cities) {
                groups[countyName].push({ ...city, county: countyName })
              }
            }
          }
        }
        for (const county of Object.keys(groups)) {
          groups[county].sort((a, b) => a.name.localeCompare(b.name))
        }
        setCountyGroups(groups)
      } catch {
        setError('Failed to load locations')
      } finally {
        setLoadingLocations(false)
      }
    }
    load()
  }, [])

  // ── Auto-detect replacements when source page changes ──
  useEffect(() => {
    if (!sourcePage) {
      setReplacements([])
      return
    }

    const detected: ReplacementPair[] = []

    // Try to detect city/county from the page title or slug
    const titleParts = sourcePage.title.split(' in ')
    if (titleParts.length > 1) {
      const locationPart = titleParts[titleParts.length - 1]
      // Try to extract city name
      const cityMatch = locationPart.match(/^([^,]+)/)?.[1]?.trim()
      if (cityMatch) {
        detected.push({ find: cityMatch, replace: '{{CITY}}' })
      }
      // Try to extract county
      const countyMatch = locationPart.match(/(\w[\w\s]+)\s+County/)?.[1]?.trim()
      if (countyMatch) {
        detected.push({ find: countyMatch, replace: '{{COUNTY}}' })
      }
    }

    // Detect "Florida" or "FL"
    detected.push({ find: 'Florida', replace: 'Florida' })
    detected.push({ find: 'FL', replace: 'FL' })

    setReplacements(detected)
  }, [sourcePage])

  // ── Helpers ──
  const cityKey = (city: string, county: string) => `${county}::${city}`

  const toggleCity = (city: string, county: string) => {
    setSelectedCities((prev) => {
      const next = new Set(prev)
      const key = cityKey(city, county)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleCounty = (county: string) => {
    const cities = countyGroups[county] || []
    const allSelected = cities.every((c) => selectedCities.has(cityKey(c.name, county)))
    setSelectedCities((prev) => {
      const next = new Set(prev)
      for (const c of cities) {
        const key = cityKey(c.name, county)
        if (allSelected) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  const updateReplacement = (index: number, field: 'find' | 'replace', value: string) => {
    setReplacements((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addReplacement = () => {
    setReplacements((prev) => [...prev, { find: '', replace: '' }])
  }

  const removeReplacement = (index: number) => {
    setReplacements((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Copy handler ──
  const handleCopy = async () => {
    if (!sourcePage) return
    setCopying(true)
    setCopyProgress(0)
    setCopyResults([])
    setError(null)

    const cityList = Array.from(selectedCities).map((key) => {
      const [county, city] = key.split('::')
      return { city, county }
    })

    const results: typeof copyResults = []
    let completed = 0

    for (const { city, county } of cityList) {
      try {
        // Build replacement map for this city
        const replaceMap = replacements.map((r) => ({
          find: r.find,
          replace: r.replace === '{{CITY}}' ? city : r.replace === '{{COUNTY}}' ? county : r.replace
        }))

        // Apply replacements to the source page content
        let title = sourcePage.title
        let metaTitle = sourcePage.meta_title || ''
        let metaDesc = sourcePage.meta_description || ''
        let contentStr = JSON.stringify(sourcePage.content)

        for (const { find, replace } of replaceMap) {
          if (!find) continue
          const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          title = title.replace(regex, replace)
          metaTitle = metaTitle.replace(regex, replace)
          metaDesc = metaDesc.replace(regex, replace)
          contentStr = contentStr.replace(regex, replace)
        }

        const slug = generateSlug(city, county)

        const page = await APIContentPages.createPage({
          title,
          slug,
          meta_title: metaTitle || undefined,
          meta_description: metaDesc || undefined,
          content: JSON.parse(contentStr),
          status: 'draft'
        })

        results.push({ city, status: 'created', pageId: page.id })
      } catch (err: any) {
        results.push({ city, status: 'error', error: err?.message || 'Failed to copy' })
      }

      completed++
      setCopyProgress(Math.round((completed / cityList.length) * 100))
      setCopyResults([...results])
    }

    setCopying(false)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Copy Page to Cities
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a source page and target cities. The page content will be duplicated with automatic text replacements.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Source page selection */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            1. Select Source Page
          </Typography>
          {loadingPages ? (
            <CircularProgress size={24} />
          ) : (
            <Autocomplete
              options={pages}
              getOptionLabel={(page) => `${page.title} (/${page.slug})`}
              value={sourcePage}
              onChange={(_, value) => setSourcePage(value)}
              renderInput={(params) => (
                <TextField {...params} label="Search pages..." variant="outlined" fullWidth />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          )}
        </Box>

        {/* Replacement mapping */}
        {sourcePage && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              2. Text Replacements
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Auto-detected replacements from the source page. Use {'{{CITY}}'} and {'{{COUNTY}}'} as
              placeholders that will be replaced with each target city/county name.
            </Typography>

            {replacements.map((pair, idx) => (
              <Stack key={idx} direction="row" spacing={2} sx={{ mb: 1 }} alignItems="center">
                <TextField
                  label="Find"
                  value={pair.find}
                  onChange={(e) => updateReplacement(idx, 'find', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Typography color="text.secondary">→</Typography>
                <TextField
                  label="Replace with"
                  value={pair.replace}
                  onChange={(e) => updateReplacement(idx, 'replace', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={() => removeReplacement(idx)} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} size="small" onClick={addReplacement} sx={{ mt: 1 }}>
              Add Replacement
            </Button>
          </Box>
        )}

        {/* Target city selection */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {sourcePage ? '3.' : '2.'} Select Target Cities
          </Typography>

          {loadingLocations ? (
            <CircularProgress size={24} />
          ) : (
            Object.entries(countyGroups).map(([county, cities]) => {
              const allSelected = cities.every((c) =>
                selectedCities.has(cityKey(c.name, county))
              )
              const someSelected = cities.some((c) =>
                selectedCities.has(cityKey(c.name, county))
              )

              return (
                <Box key={county} sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={() => toggleCounty(county)}
                      />
                    }
                    label={
                      <Typography variant="subtitle2" fontWeight="bold">
                        {county} County ({cities.length} cities)
                      </Typography>
                    }
                  />
                  <FormGroup
                    sx={{
                      ml: 3,
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                        lg: '1fr 1fr 1fr 1fr'
                      },
                      gap: 0
                    }}
                  >
                    {cities.map((city) => (
                      <FormControlLabel
                        key={cityKey(city.name, county)}
                        control={
                          <Checkbox
                            checked={selectedCities.has(cityKey(city.name, county))}
                            onChange={() => toggleCity(city.name, county)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {city.name}{' '}
                            <Chip
                              label={city.activeCount}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>
              )
            })
          )}
        </Box>

        {/* Progress bar */}
        {copying && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Copying pages... {copyProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={copyProgress} />
          </Box>
        )}

        {/* Results */}
        {copyResults.length > 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Results
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>City</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {copyResults.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{result.city}</TableCell>
                      <TableCell>
                        <StatusChip
                          status={result.status === 'created' ? 'created' : 'error'}
                          error={result.error}
                        />
                      </TableCell>
                      <TableCell>
                        {result.pageId && (
                          <Button
                            size="small"
                            href={`/admin/content-pages?edit=${result.pageId}`}
                            target="_blank"
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Copy button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={copying ? <CircularProgress size={20} color="inherit" /> : <CopyIcon />}
            onClick={handleCopy}
            disabled={!sourcePage || selectedCities.size === 0 || copying}
            size="large"
          >
            {copying
              ? 'Copying...'
              : `Copy to ${selectedCities.size} ${selectedCities.size === 1 ? 'City' : 'Cities'}`}
          </Button>
        </Box>
      </Stack>
    </Paper>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Shared Components
// ═════════════════════════════════════════════════════════════════════════════

function StatusChip({ status, error }: { status: string; error?: string }) {
  const config: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' | 'warning' }> = {
    pending: { label: 'Pending', color: 'default' },
    creating: { label: 'Creating...', color: 'info' },
    created: { label: 'Created', color: 'success' },
    error: { label: error || 'Error', color: 'error' }
  }
  const { label, color } = config[status] || config.pending
  return <Chip label={label} color={color} size="small" />
}
