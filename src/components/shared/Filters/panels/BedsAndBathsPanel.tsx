'use client'

import { useState } from 'react'

import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'

const bedOptions = [
  { label: 'Any', value: 0 },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 }
]

const bathOptions = [
  { label: 'Any', value: 0 },
  { label: '1+', value: 1 },
  { label: '1.5+', value: 1.5 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 }
]

const segmentSx = {
  '& .MuiToggleButton-root': {
    px: 2,
    py: 0.75,
    textTransform: 'none' as const,
    fontSize: '0.8125rem',
    fontWeight: 600
  }
}

const BedsAndBathsPanel = ({
  minBeds,
  minBaths,
  onApply
}: {
  minBeds: number
  minBaths: number
  onApply: (beds: number, baths: number, exactMatch: boolean) => void
}) => {
  const [beds, setBeds] = useState(minBeds || 0)
  const [baths, setBaths] = useState(minBaths || 0)
  const [exact, setExact] = useState(false)

  return (
    <Stack spacing={2} sx={{ p: 2, minWidth: 320 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        Bedrooms
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={beds}
        onChange={(_, v) => v !== null && setBeds(v)}
        size="small"
        fullWidth
        sx={segmentSx}
      >
        {bedOptions.map((o) => (
          <ToggleButton key={o.value} value={o.value}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={exact}
            onChange={(e) => setExact(e.target.checked)}
          />
        }
        label="Use exact match"
        slotProps={{ typography: { variant: 'body2' } }}
      />

      <Typography variant="subtitle2" fontWeight={600}>
        Bathrooms
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={baths}
        onChange={(_, v) => v !== null && setBaths(v)}
        size="small"
        fullWidth
        sx={segmentSx}
      >
        {bathOptions.map((o) => (
          <ToggleButton key={o.value} value={o.value}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Button
        variant="contained"
        size="small"
        fullWidth
        onClick={() => onApply(beds, baths, exact)}
      >
        Apply
      </Button>
    </Stack>
  )
}

export default BedsAndBathsPanel
