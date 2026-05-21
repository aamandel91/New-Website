'use client'

import { useContext } from 'react'
import { Box, Typography } from '@mui/material'

import { SearchContext } from 'providers/SearchProvider'

const SchoolBadge = ({ mlsNumber }: { mlsNumber: string }) => {
  // Cards may be rendered outside a SearchProvider (e.g. on the home page,
  // PDP, blog). Reading the context directly with a fallback prevents a
  // crash; the badge is search-only.
  const ctx = useContext(SearchContext)
  if (!ctx?.schoolMeta?.active) return null
  const data = ctx.schoolMeta.schoolDataByMlsNumber?.[mlsNumber]
  if (!data) return null

  const parts: string[] = []
  if (data.elementary && typeof data.elementary.rating === 'number') {
    parts.push(`Elem ${data.elementary.rating}`)
  }
  if (data.middle && typeof data.middle.rating === 'number') {
    parts.push(`Middle ${data.middle.rating}`)
  }
  if (data.high && typeof data.high.rating === 'number') {
    parts.push(`High ${data.high.rating}`)
  }
  if (!parts.length) return null

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'rgba(34, 139, 34, 0.08)',
        color: 'rgb(20, 95, 30)',
        width: 'fit-content',
        pointerEvents: 'none'
      }}
    >
      <Typography variant="caption" fontWeight={600} component="span">
        {parts.join(' · ')}
      </Typography>
    </Box>
  )
}

export default SchoolBadge
