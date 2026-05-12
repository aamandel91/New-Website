'use client'

import React, { useState, useCallback } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SearchIcon from '@mui/icons-material/Search'

import { APIChat } from 'services/API'
import { tenant } from '@/configs/tenant.config'

import { parseNlpParams } from './utils/nlpParser'
import { trackAiPromptSubmitted } from './utils/analytics'
import type { AiActivityLogEntry, AiSearchFilters } from './types'

const SAMPLE_PROMPTS = [
  '3 bedroom condos in Boca Raton under 900k with a pool',
  'Waterfront homes for rent in Fort Lauderdale',
  '4+ bed family houses in Coral Gables under 2M',
]

const FUN_STATUS_MESSAGES = [
  'Crunching the numbers…',
  'Consulting the property spirits…',
  'Scouring the neighborhoods…',
  'Asking the real estate gods…',
]

interface AiSearchPanelProps {
  filters: AiSearchFilters
  onFiltersChange: (next: AiSearchFilters) => void
  onLocationUpdate?: (loc: { center?: [number, number]; zoom?: number; bounds?: number[][][] }) => void
}

export function AiSearchPanel({ filters, onFiltersChange, onLocationUpdate }: AiSearchPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [log, setLog] = useState<AiActivityLogEntry[]>([])

  const addLog = useCallback((entry: { kind: AiActivityLogEntry['kind'] } & Record<string, any>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setLog((prev) => {
      const filtered =
        entry.kind === 'understood' || entry.kind === 'error'
          ? prev.filter((e) => e.kind !== 'status')
          : prev
      return [...filtered, { ...entry, id, ts: Date.now() } as AiActivityLogEntry].slice(-50)
    })
  }, [])

  const runSearch = useCallback(
    async (raw: string) => {
      const query = raw.trim()
      if (!query) return

      setPrompt(query)
      addLog({ kind: 'prompt', text: query })
      addLog({
        kind: 'status',
        text: FUN_STATUS_MESSAGES[Math.floor(Math.random() * FUN_STATUS_MESSAGES.length)],
      })
      trackAiPromptSubmitted(query)
      setLoading(true)

      try {
        const { request, nlpId } = await APIChat.fetchReply({ value: query, token })
        setToken(nlpId)

        const parsed = parseNlpParams((request as any).params)
        const merged: AiSearchFilters = {
          ...filters,
          ...parsed,
          propertyTypes: parsed.propertyTypes ?? filters.propertyTypes,
        }
        onFiltersChange(merged)

        addLog({
          kind: 'understood',
          summary: request.summary || 'Search understood',
          filters: parsed,
        })

        // Try to extract a center/zoom from the response: the backend strips
        // url but keeps `request.body` and `request.locations` when present.
        const locations = (request as any).locations as
          | Array<{
              name?: string
              type?: string
              map?: { latitude?: string | number; longitude?: string | number; boundary?: number[][][] }
            }>
          | undefined
        if (locations && locations.length > 0 && onLocationUpdate) {
          const loc = locations[0]
          const m = loc.map
          if (m?.latitude !== undefined && m?.longitude !== undefined) {
            const center: [number, number] = [parseFloat(String(m.longitude)), parseFloat(String(m.latitude))]
            const zoom = loc.type === 'neighborhood' ? 14 : loc.type === 'city' ? 11 : loc.type === 'area' ? 10 : 12
            onLocationUpdate({ center, zoom, bounds: m.boundary })
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed'
        addLog({ kind: 'error', text: msg })
      } finally {
        setLoading(false)
      }
    },
    [addLog, filters, onFiltersChange, onLocationUpdate, token]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(prompt)
  }

  const accent = tenant.visualIdentity.colors.primary
  const accentDark = tenant.visualIdentity.colors.primaryDark
  const border = tenant.visualIdentity.colors.border

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 5,
        width: { xs: 'calc(100vw - 32px)', sm: 460 },
        maxHeight: 'calc(100vh - 100px)',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <AutoAwesomeIcon sx={{ color: accent, fontSize: 20 }} />
        <TextField
          fullWidth
          size="small"
          variant="standard"
          placeholder='Try "3 bedroom condo in Boca under 900k"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          InputProps={{ disableUnderline: true, sx: { fontSize: 14 } }}
          disabled={loading}
        />
        <IconButton type="submit" disabled={loading || !prompt.trim()} size="small" sx={{ color: accent }}>
          {loading ? <CircularProgress size={18} /> : <SearchIcon />}
        </IconButton>
      </Box>

      <Box sx={{ p: 1.5, overflow: 'auto', flex: 1 }}>
        {log.length === 0 ? (
          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Try these searches
            </Typography>
            {SAMPLE_PROMPTS.map((p) => (
              <Button
                key={p}
                onClick={() => runSearch(p)}
                disabled={loading}
                variant="outlined"
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  borderColor: border,
                  color: 'text.primary',
                  fontSize: 13,
                  '&:hover': { borderColor: accent, bgcolor: 'rgba(0,0,0,0.02)' },
                }}
              >
                {p}
              </Button>
            ))}
          </Stack>
        ) : (
          <Stack spacing={1}>
            {log.map((entry) => {
              if (entry.kind === 'prompt') {
                return (
                  <Typography key={entry.id} variant="body2" sx={{ color: 'text.secondary' }}>
                    <strong>You:</strong> {entry.text}
                  </Typography>
                )
              }
              if (entry.kind === 'status') {
                return (
                  <Stack key={entry.id} direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={12} sx={{ color: accent }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      {entry.text}
                    </Typography>
                  </Stack>
                )
              }
              if (entry.kind === 'understood') {
                return (
                  <Box key={entry.id}>
                    <Typography variant="body2" sx={{ color: accentDark, fontWeight: 600 }}>
                      {entry.summary}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {Object.entries(entry.filters).map(([k, v]) => (
                        <Chip
                          key={k}
                          label={`${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`}
                          size="small"
                          sx={{ bgcolor: tenant.visualIdentity.colors.primaryLight, color: accentDark, fontSize: 11 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )
              }
              return (
                <Typography key={entry.id} variant="caption" sx={{ color: 'error.main' }}>
                  {entry.text}
                </Typography>
              )
            })}
          </Stack>
        )}
      </Box>
    </Box>
  )
}
