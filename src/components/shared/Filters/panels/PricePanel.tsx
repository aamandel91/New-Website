'use client'

import { useState } from 'react'

import { Button, Stack, TextField, Typography } from '@mui/material'

const PricePanel = ({
  minPrice,
  maxPrice,
  onApply
}: {
  minPrice: number
  maxPrice: number
  onApply: (min: number, max: number) => void
}) => {
  const [min, setMin] = useState(minPrice || 0)
  const [max, setMax] = useState(maxPrice || 0)

  return (
    <Stack spacing={2} sx={{ p: 2, minWidth: 280 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        Price Range
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          type="number"
          placeholder="No min"
          value={min || ''}
          onChange={(e) => setMin(Number(e.target.value) || 0)}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
        <TextField
          size="small"
          type="number"
          placeholder="No max"
          value={max || ''}
          onChange={(e) => setMax(Number(e.target.value) || 0)}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </Stack>
      <Button
        variant="contained"
        size="small"
        fullWidth
        onClick={() => onApply(min, max)}
      >
        Apply
      </Button>
    </Stack>
  )
}

export default PricePanel
