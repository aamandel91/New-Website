'use client'

import { useState } from 'react'

import {
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
  Typography
} from '@mui/material'

import type { ListingType } from '@configs/filters'

const homeTypes: Array<{ value: ListingType; label: string }> = [
  { value: 'residential', label: 'Houses' },
  { value: 'townhome', label: 'Townhomes' },
  { value: 'multiFamily', label: 'Multi-family' },
  { value: 'condo', label: 'Condos/Co-ops' },
  { value: 'land', label: 'Lots/Land' }
]

const HomeTypePanel = ({
  value,
  onApply
}: {
  value: ListingType[]
  onApply: (types: ListingType[]) => void
}) => {
  const [selected, setSelected] = useState<ListingType[]>(value)

  const allSelected = selected.length === homeTypes.length
  const noneSelected = selected.length === 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected([])
    } else {
      setSelected(homeTypes.map((t) => t.value))
    }
  }

  const toggle = (type: ListingType) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  return (
    <Stack spacing={1} sx={{ p: 2, minWidth: 220 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={600}>
          Home Type
        </Typography>
        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={toggleAll}
        >
          {allSelected || noneSelected ? 'Select All' : 'Deselect All'}
        </Link>
      </Stack>
      {homeTypes.map((type) => (
        <FormControlLabel
          key={type.value}
          control={
            <Checkbox
              size="small"
              checked={selected.includes(type.value)}
              onChange={() => toggle(type.value)}
            />
          }
          label={type.label}
          slotProps={{ typography: { variant: 'body2' } }}
        />
      ))}
      <Button
        variant="contained"
        size="small"
        fullWidth
        onClick={() => onApply(selected)}
      >
        Apply
      </Button>
    </Stack>
  )
}

export default HomeTypePanel
