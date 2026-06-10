'use client'

import React, { useCallback, useEffect, useState } from 'react'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

const ALL_WIDGETS = [
  'SearchWidget',
  'HowsTheMarket',
  'BrowseByType',
  'PopularSearches',
  'RecentBlogs',
  'ReadyToChat',
  'SellerResources',
  'BuyerResources',
  'TodaysListings',
  'BlogCategories',
  'BlogArchives',
  'BlogTags'
]

const PAGE_TYPES = [
  'city',
  'neighborhood',
  'subtype',
  'zip',
  'sell',
  'about',
  'contact',
  'blog'
] as const
type PageType = (typeof PAGE_TYPES)[number]

interface PageConfig {
  widgets: string[]
  enabled: boolean
}

interface WidgetSettings {
  ReadyToChat?: {
    headline: string
    subtext: string
    buttonText: string
    buttonLink: string
  }
  SellerResources?: {
    links: Array<{ label: string; href: string }>
  }
  BuyerResources?: {
    links: Array<{ label: string; href: string }>
  }
}

interface SidebarConfig {
  pageTypes: Record<PageType, PageConfig>
  widgetSettings: WidgetSettings
}

export default function AdminSidebarWidgets() {
  const [config, setConfig] = useState<SidebarConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sidebar-config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch {
      setError('Failed to load config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setSuccess(false)
    setError(null)
    try {
      const res = await fetch('/api/admin/sidebar-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        setError('Failed to save')
      }
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleWidget = (pageType: PageType, widget: string) => {
    if (!config) return
    setConfig((prev) => {
      if (!prev) return prev
      const page = prev.pageTypes[pageType]
      const widgets = page.widgets.includes(widget)
        ? page.widgets.filter((w) => w !== widget)
        : [...page.widgets, widget]
      return {
        ...prev,
        pageTypes: { ...prev.pageTypes, [pageType]: { ...page, widgets } }
      }
    })
  }

  const moveWidget = (
    pageType: PageType,
    index: number,
    direction: 'up' | 'down'
  ) => {
    if (!config) return
    setConfig((prev) => {
      if (!prev) return prev
      const page = prev.pageTypes[pageType]
      const widgets = [...page.widgets]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= widgets.length) return prev
      ;[widgets[index], widgets[newIndex]] = [widgets[newIndex], widgets[index]]
      return {
        ...prev,
        pageTypes: { ...prev.pageTypes, [pageType]: { ...page, widgets } }
      }
    })
  }

  const togglePage = (pageType: PageType) => {
    if (!config) return
    setConfig((prev) => {
      if (!prev) return prev
      const page = prev.pageTypes[pageType]
      return {
        ...prev,
        pageTypes: {
          ...prev.pageTypes,
          [pageType]: { ...page, enabled: !page.enabled }
        }
      }
    })
  }

  const updateReadyToChat = (field: string, value: string) => {
    if (!config) return
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        widgetSettings: {
          ...prev.widgetSettings,
          ReadyToChat: { ...prev.widgetSettings.ReadyToChat!, [field]: value }
        }
      }
    })
  }

  const updateResourceLink = (
    widget: 'SellerResources' | 'BuyerResources',
    index: number,
    field: 'label' | 'href',
    value: string
  ) => {
    if (!config) return
    setConfig((prev) => {
      if (!prev) return prev
      const links = [...(prev.widgetSettings[widget]?.links || [])]
      links[index] = { ...links[index], [field]: value }
      return {
        ...prev,
        widgetSettings: { ...prev.widgetSettings, [widget]: { links } }
      }
    })
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    )
  }

  if (!config) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load sidebar configuration</Alert>
      </Container>
    )
  }

  const selectedPageType = PAGE_TYPES[activeTab] || 'city'
  const pageConfig = config.pageTypes[selectedPageType]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={700} sx={{ color: NAVY }}>
          Sidebar Widgets
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: GOLD, '&:hover': { bgcolor: '#a8903e' } }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Stack>

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(false)}
        >
          Configuration saved successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Page Type Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {PAGE_TYPES.map((pt) => (
            <Tab key={pt} label={pt.charAt(0).toUpperCase() + pt.slice(1)} />
          ))}
        </Tabs>
      </Paper>

      {/* Widget Configuration for Selected Page */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={600}>
            {selectedPageType.charAt(0).toUpperCase() +
              selectedPageType.slice(1)}{' '}
            Page Widgets
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">Sidebar Enabled</Typography>
            <Switch
              checked={pageConfig.enabled}
              onChange={() => togglePage(selectedPageType)}
              color="primary"
            />
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Active widgets (drag to reorder):
        </Typography>

        <List>
          {pageConfig.widgets.map((widget, index) => (
            <ListItem
              key={widget}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => moveWidget(selectedPageType, index, 'up')}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === pageConfig.widgets.length - 1}
                    onClick={() => moveWidget(selectedPageType, index, 'down')}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
              sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText
                primary={widget}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Toggle widgets:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {ALL_WIDGETS.map((widget) => (
            <Chip
              key={widget}
              label={widget}
              onClick={() => toggleWidget(selectedPageType, widget)}
              color={
                pageConfig.widgets.includes(widget) ? 'primary' : 'default'
              }
              variant={
                pageConfig.widgets.includes(widget) ? 'filled' : 'outlined'
              }
              size="small"
            />
          ))}
        </Box>
      </Paper>

      {/* Widget Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Widget Settings
        </Typography>

        {/* Ready to Chat */}
        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
          Ready to Chat CTA
        </Typography>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Headline"
            size="small"
            fullWidth
            value={config.widgetSettings.ReadyToChat?.headline || ''}
            onChange={(e) => updateReadyToChat('headline', e.target.value)}
          />
          <TextField
            label="Subtext"
            size="small"
            fullWidth
            value={config.widgetSettings.ReadyToChat?.subtext || ''}
            onChange={(e) => updateReadyToChat('subtext', e.target.value)}
          />
          <TextField
            label="Button Text"
            size="small"
            fullWidth
            value={config.widgetSettings.ReadyToChat?.buttonText || ''}
            onChange={(e) => updateReadyToChat('buttonText', e.target.value)}
          />
          <TextField
            label="Button Link"
            size="small"
            fullWidth
            value={config.widgetSettings.ReadyToChat?.buttonLink || ''}
            onChange={(e) => updateReadyToChat('buttonLink', e.target.value)}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Seller Resources */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Seller Resources Links
        </Typography>
        <Stack spacing={1} sx={{ mb: 3 }}>
          {(config.widgetSettings.SellerResources?.links || []).map(
            (link, i) => (
              <Stack key={i} direction="row" spacing={1}>
                <TextField
                  label="Label"
                  size="small"
                  value={link.label}
                  onChange={(e) =>
                    updateResourceLink(
                      'SellerResources',
                      i,
                      'label',
                      e.target.value
                    )
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="URL"
                  size="small"
                  value={link.href}
                  onChange={(e) =>
                    updateResourceLink(
                      'SellerResources',
                      i,
                      'href',
                      e.target.value
                    )
                  }
                  sx={{ flex: 1 }}
                />
              </Stack>
            )
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Buyer Resources */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Buyer Resources Links
        </Typography>
        <Stack spacing={1}>
          {(config.widgetSettings.BuyerResources?.links || []).map(
            (link, i) => (
              <Stack key={i} direction="row" spacing={1}>
                <TextField
                  label="Label"
                  size="small"
                  value={link.label}
                  onChange={(e) =>
                    updateResourceLink(
                      'BuyerResources',
                      i,
                      'label',
                      e.target.value
                    )
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="URL"
                  size="small"
                  value={link.href}
                  onChange={(e) =>
                    updateResourceLink(
                      'BuyerResources',
                      i,
                      'href',
                      e.target.value
                    )
                  }
                  sx={{ flex: 1 }}
                />
              </Stack>
            )
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
