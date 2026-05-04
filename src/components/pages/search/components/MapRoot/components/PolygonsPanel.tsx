'use client'

import CloseIcon from '@mui/icons-material/Close'
import {
  alpha,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'

import { error as errorColor, success as successColor } from '@configs/colors'

import { useSearch } from 'providers/SearchProvider'

type Props = {
  onHighlight?: (index: number | null) => void
}

const PolygonsPanel = ({ onHighlight }: Props) => {
  const { polygons, removePolygonZone, clearPolygons } = useSearch()

  if (!polygons.length) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 16,
        bottom: 215,
        width: 220,
        zIndex: 'fab',
        boxShadow: 2,
        borderRadius: 1.5,
        bgcolor: alpha('#FFFFFF', 0.95),
        backdropFilter: 'blur(4px)',
        p: 1,
        display: { xs: 'none', sm: 'block' }
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 600,
          color: 'text.secondary',
          mb: 0.5,
          ml: 0.5
        }}
      >
        Search areas
      </Typography>

      <Stack spacing={0.5}>
        {polygons.map((zone, idx) => {
          const color = zone.type === 'exclude' ? errorColor : successColor
          const labelPrefix = zone.type === 'exclude' ? 'Exclude' : 'Include'
          return (
            <Stack
              key={idx}
              direction="row"
              alignItems="center"
              spacing={1}
              onMouseEnter={() => onHighlight?.(idx)}
              onMouseLeave={() => onHighlight?.(null)}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: alpha(color, 0.08) }
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: alpha(color, 0.25),
                  border: `2px solid ${color}`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color
                }}
              >
                {idx + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{ flex: 1, fontSize: 13 }}
              >
                {labelPrefix} zone {idx + 1}
              </Typography>
              <Tooltip title="Remove" arrow>
                <IconButton
                  size="small"
                  onClick={() => removePolygonZone(idx)}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        })}
      </Stack>

      {polygons.some((z) => z.type === 'exclude') && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            px: 1,
            color: 'text.secondary',
            fontStyle: 'italic',
            lineHeight: 1.3
          }}
        >
          Listings inside exclusion zones are hidden from results.
        </Typography>
      )}

      {polygons.length > 1 && (
        <Button
          size="small"
          fullWidth
          onClick={() => clearPolygons()}
          sx={{ mt: 0.5, fontSize: 12 }}
        >
          Clear all
        </Button>
      )}
    </Box>
  )
}

export default PolygonsPanel
