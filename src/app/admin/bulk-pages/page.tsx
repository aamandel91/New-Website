'use client'

import React, { useState } from 'react'
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
  type BulkPageGenerationResult
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

  // Mock data for cities/zipcodes/neighborhoods (in production, this would come from API)
  const [locationInput, setLocationInput] = useState('')

  const handlePreview = async () => {
    if (pageType === 'property_type' && selectedIds.length === 0) {
      setError('Please select at least one property type')
      return
    }

    if (pageType !== 'property_type' && !locationInput) {
      setError('Please enter location IDs (comma-separated)')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setPreview([])

      const ids = pageType === 'property_type'
        ? selectedIds
        : locationInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

      if (ids.length === 0) {
        setError('Please provide valid IDs')
        return
      }

      const previewData = await APIAIContent.previewBulkPages({
        pageType: pageType as any,
        selectedIds: ids,
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

      const ids = pageType === 'property_type'
        ? selectedIds
        : locationInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

      const result = await APIAIContent.generateBulkPages({
        pageType: pageType as any,
        selectedIds: ids,
        template: useTemplate ? template : undefined,
        autoPublish
      })

      setGenerationResult(result)
      setSuccess(`Successfully generated ${result.generated} pages!`)
      setPreview([])
      setSelectedIds([])
      setLocationInput('')
    } catch (err: any) {
      setError(err?.message || 'Failed to generate pages')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePropertyType = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
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
                      setPreview([])
                      setSelectedIds([])
                      setLocationInput('')
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
                            onClick={() => handleTogglePropertyType(pt.id)}
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
                  <TextField
                    label="Location IDs"
                    fullWidth
                    multiline
                    rows={4}
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter comma-separated IDs (e.g., 1, 2, 3, 4)"
                    helperText="In production, this would be a searchable dropdown"
                  />
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
