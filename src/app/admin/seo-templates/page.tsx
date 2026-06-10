'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'

import APISeoMetaTemplates, {
  ACTIVE_SEO_PAGE_TYPES,
  SEO_PAGE_TYPES,
  type SeoMetaTemplate,
  type SeoPageType
} from '@/services/API/APISeoMetaTemplates'

interface TabConfig {
  pageType: SeoPageType
  label: string
  example: string
  placeholders: string[]
}

const COMMON_PLACEHOLDERS = ['{COMPANY}', '{STATE}', '{STATE_FULL}']
const LIVE_DATA_PLACEHOLDERS = [
  '{COUNT}',
  '{AVG_PRICE}',
  '{MEDIAN_PRICE}',
  '{MIN_PRICE}',
  '{MAX_PRICE}'
]

const TAB_CONFIG: TabConfig[] = [
  {
    pageType: 'city',
    label: 'City',
    example: '/boca-raton',
    placeholders: [
      '{CITY}',
      '{COUNTY}',
      ...COMMON_PLACEHOLDERS,
      ...LIVE_DATA_PLACEHOLDERS
    ]
  },
  {
    pageType: 'city_subtype',
    label: 'City + Subtype',
    example: '/boca-raton/condos',
    placeholders: [
      '{CITY}',
      '{SUBTYPE}',
      '{SUBTYPE_PLURAL}',
      ...COMMON_PLACEHOLDERS,
      ...LIVE_DATA_PLACEHOLDERS
    ]
  },
  {
    pageType: 'neighborhood',
    label: 'Neighborhood',
    example: '/boca-raton/country-isles',
    placeholders: [
      '{CITY}',
      '{NEIGHBORHOOD}',
      '{COMMUNITY}',
      ...COMMON_PLACEHOLDERS,
      ...LIVE_DATA_PLACEHOLDERS
    ]
  },
  {
    pageType: 'zipcode',
    label: 'ZIP',
    example: '/boca-raton/33401',
    placeholders: [
      '{CITY}',
      '{ZIP}',
      ...COMMON_PLACEHOLDERS,
      ...LIVE_DATA_PLACEHOLDERS
    ]
  },
  {
    pageType: 'property_type',
    label: 'Property Type',
    example: '/condos',
    placeholders: [
      '{SUBTYPE}',
      '{SUBTYPE_PLURAL}',
      ...COMMON_PLACEHOLDERS,
      ...LIVE_DATA_PLACEHOLDERS
    ]
  },
  {
    pageType: 'county',
    label: 'County',
    example: '(future)',
    placeholders: [
      '{COUNTY}',
      ...COMMON_PLACEHOLDERS,
      ...LIVE_DATA_PLACEHOLDERS
    ]
  },
  {
    pageType: 'school_elementary',
    label: 'School — Elementary',
    example: '(future)',
    placeholders: ['{SCHOOL}', '{CITY}', ...COMMON_PLACEHOLDERS]
  },
  {
    pageType: 'school_middle',
    label: 'School — Middle',
    example: '(future)',
    placeholders: ['{SCHOOL}', '{CITY}', ...COMMON_PLACEHOLDERS]
  },
  {
    pageType: 'school_high',
    label: 'School — High',
    example: '(future)',
    placeholders: ['{SCHOOL}', '{CITY}', ...COMMON_PLACEHOLDERS]
  },
  {
    pageType: 'school_district',
    label: 'School District',
    example: '(future)',
    placeholders: ['{SCHOOL_DISTRICT}', ...COMMON_PLACEHOLDERS]
  },
  {
    pageType: 'popular_search',
    label: 'Popular Search',
    example: '(future)',
    placeholders: ['{POPULAR_SEARCH}', ...COMMON_PLACEHOLDERS]
  }
]

function isFuture(pageType: SeoPageType): boolean {
  return !ACTIVE_SEO_PAGE_TYPES.includes(pageType)
}

interface TabPanelProps {
  config: TabConfig
  template: SeoMetaTemplate | null
  onSaved: (t: SeoMetaTemplate) => void
}

function TabPanel({ config, template, onSaved }: TabPanelProps) {
  const [titleTemplate, setTitleTemplate] = useState(
    template?.title_template ?? ''
  )
  const [descriptionTemplate, setDescriptionTemplate] = useState(
    template?.description_template ?? ''
  )
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewDescription, setPreviewDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitleTemplate(template?.title_template ?? '')
    setDescriptionTemplate(template?.description_template ?? '')
  }, [template?.id, template?.title_template, template?.description_template])

  // Debounced server-side preview rendering — fires 350ms after typing stops.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await APISeoMetaTemplates.previewLive(
          config.pageType,
          titleTemplate,
          descriptionTemplate
        )
        setPreviewTitle(result.title)
        setPreviewDescription(result.description)
      } catch (err) {
        // preview failures aren't fatal — leave previous values
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [titleTemplate, descriptionTemplate, config.pageType])

  const copyChip = useCallback(async (placeholder: string) => {
    try {
      await navigator.clipboard.writeText(placeholder)
      setToast(`Copied ${placeholder}`)
    } catch {
      setToast('Copy failed — please copy manually')
    }
  }, [])

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const saved = await APISeoMetaTemplates.upsert({
        pageType: config.pageType,
        titleTemplate,
        descriptionTemplate,
        enabled: true
      })
      onSaved(saved)
      setToast('Saved')
    } catch (err: any) {
      setError(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setError(null)
    setResetting(true)
    try {
      const reset = await APISeoMetaTemplates.resetToDefault(config.pageType)
      onSaved(reset)
      setTitleTemplate(reset.title_template)
      setDescriptionTemplate(reset.description_template)
      setToast('Reset to default')
    } catch (err: any) {
      setError(err?.message || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Box>
      {isFuture(config.pageType) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No pages of this type exist on the site yet. Template will activate
          when these page types are built. You can still configure it now.
        </Alert>
      )}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Example route
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {config.example}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleReset}
            startIcon={<RestartAltIcon />}
            disabled={resetting || saving}
            variant="outlined"
            size="small"
          >
            Reset to default
          </Button>
          <Button
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={
              saving || resetting || !titleTemplate || !descriptionTemplate
            }
            variant="contained"
            size="small"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Dynamic Placeholders
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5 }}
        >
          Click any chip to copy it to your clipboard.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {config.placeholders.map((p) => (
            <Chip
              key={p}
              label={p}
              size="small"
              icon={<ContentCopyIcon style={{ fontSize: 14 }} />}
              onClick={() => copyChip(p)}
              sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Paper>

      <Typography variant="subtitle2" gutterBottom>
        Default Meta Title Template
      </Typography>
      <TextField
        fullWidth
        value={titleTemplate}
        onChange={(e) => setTitleTemplate(e.target.value)}
        placeholder="e.g. {COUNT} Homes for Sale in {CITY}, {STATE}"
        sx={{
          mb: 3,
          fontFamily: 'monospace',
          '& input': { fontFamily: 'monospace' }
        }}
      />

      <Typography variant="subtitle2" gutterBottom>
        Default Meta Description Template
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        value={descriptionTemplate}
        onChange={(e) => setDescriptionTemplate(e.target.value)}
        placeholder="e.g. Browse {COUNT} homes for sale in {CITY}, {STATE_FULL}…"
        sx={{ mb: 3, '& textarea': { fontFamily: 'monospace' } }}
      />

      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Preview
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5 }}
        >
          Rendered with sample data for this page type.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            &lt;title&gt;
          </Typography>
          <Typography
            sx={{
              color: '#1a0dab',
              fontSize: 18,
              lineHeight: 1.3,
              wordBreak: 'break-word'
            }}
          >
            {previewTitle || '—'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            &lt;meta description&gt;
          </Typography>
          <Typography sx={{ color: '#4d5156', fontSize: 14, lineHeight: 1.45 }}>
            {previewDescription || '—'}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={2000}
        onClose={() => setToast(null)}
        message={toast}
      />
    </Box>
  )
}

export default function SeoTemplatesAdminPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [templates, setTemplates] = useState<Map<SeoPageType, SeoMetaTemplate>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const all = await APISeoMetaTemplates.getAll()
        if (cancelled) return
        const map = new Map<SeoPageType, SeoMetaTemplate>()
        for (const t of all) map.set(t.page_type, t)
        setTemplates(map)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load templates')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaved = (t: SeoMetaTemplate) => {
    setTemplates((prev) => {
      const next = new Map(prev)
      next.set(t.page_type, t)
      return next
    })
  }

  const tabs = useMemo(() => TAB_CONFIG, [])
  const currentTab = tabs[activeTab]
  const currentTemplate = currentTab
    ? (templates.get(currentTab.pageType) ?? null)
    : null

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          SEO Meta Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure default page titles and descriptions for each page type.
          Templates use dynamic placeholders like {'{CITY}'} and {'{COUNT}'}{' '}
          that are filled in at render time.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((tab, i) => (
              <Tab
                key={tab.pageType}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{tab.label}</span>
                    {isFuture(tab.pageType) && (
                      <Chip
                        label="Future"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                  </Stack>
                }
                id={`seo-tab-${i}`}
              />
            ))}
          </Tabs>
          <Divider />
          <Box sx={{ p: 3 }}>
            {currentTab && (
              <TabPanel
                key={currentTab.pageType}
                config={currentTab}
                template={currentTemplate}
                onSaved={handleSaved}
              />
            )}
          </Box>
        </Paper>
      )}
    </Container>
  )
}
