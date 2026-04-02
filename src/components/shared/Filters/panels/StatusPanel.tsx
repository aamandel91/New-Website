'use client'

import { useState } from 'react'

import {
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack
} from '@mui/material'

import type { ListingStatus } from '@configs/filters'

const statusOptions: Array<{ value: ListingStatus; label: string }> = [
  { value: 'active', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'sold', label: 'Sold' }
]

const StatusPanel = ({
  value,
  onApply
}: {
  value: ListingStatus
  onApply: (value: ListingStatus) => void
}) => {
  const [local, setLocal] = useState(value)

  return (
    <Stack spacing={2} sx={{ p: 2, minWidth: 200 }}>
      <RadioGroup
        value={local}
        onChange={(e) => setLocal(e.target.value as ListingStatus)}
      >
        {statusOptions.map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            control={<Radio size="small" />}
            label={opt.label}
          />
        ))}
      </RadioGroup>
      <Button
        variant="contained"
        size="small"
        fullWidth
        onClick={() => onApply(local)}
      >
        Apply
      </Button>
    </Stack>
  )
}

export default StatusPanel
