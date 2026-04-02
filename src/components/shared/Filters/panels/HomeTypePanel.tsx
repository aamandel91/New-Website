'use client'

import { useEffect, useState } from 'react'

import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  Stack,
  Typography
} from '@mui/material'

import type { ListingType } from '@configs/filters'
import { APIAggregates } from 'services/API'
import type { AggregateItem } from 'services/API'

const PROPERTY_TYPE_MAP: Record<string, ListingType> = {
  'detached': 'residential',
  'semi-detached': 'residential',
  'att/row/twnhouse': 'townhome',
  'condo apt': 'condo',
  'condo townhouse': 'condo',
  'multiplex': 'multiFamily',
  'vacant land': 'land',
  'farm': 'land',
  'link': 'townhome',
}

const TYPE_LABELS: Record<ListingType, string> = {
  allListings: 'All',
  residential: 'Houses',
  townhome: 'Townhomes',
  multiFamily: 'Multi-family',
  condo: 'Condos/Co-ops',
  land: 'Lots/Land',
  semiDetached: 'Semi-Detached',
  business: 'Business',
  commercial: 'Commercial',
}

const STATIC_TYPES: Array<{ value: ListingType; label: string }> = [
  { value: 'residential', label: 'Houses' },
  { value: 'townhome', label: 'Townhomes' },
  { value: 'multiFamily', label: 'Multi-family' },
  { value: 'condo', label: 'Condos/Co-ops' },
  { value: 'land', label: 'Lots/Land' }
]

let cachedTypes: Array<{ value: ListingType; label: string; count: number }> | null = null

function mapAggregateToTypes(items: AggregateItem[]): Array<{ value: ListingType; label: string; count: number }> {
  const counts: Record<string, number> = {}

  for (const item of items) {
    const key = item.name.toLowerCase()
    const mapped = PROPERTY_TYPE_MAP[key]
    if (mapped) {
      counts[mapped] = (counts[mapped] || 0) + item.count
    } else {
      // Try direct match against known ListingType values
      const direct = Object.keys(TYPE_LABELS).find(
        (t) => t.toLowerCase() === key || TYPE_LABELS[t as ListingType]?.toLowerCase() === key
      ) as ListingType | undefined
      if (direct && direct !== 'allListings') {
        counts[direct] = (counts[direct] || 0) + item.count
      }
    }
  }

  return STATIC_TYPES.map((t) => ({
    ...t,
    count: counts[t.value] || 0,
  }))
}

const HomeTypePanel = ({
  value,
  onApply
}: {
  value: ListingType[]
  onApply: (types: ListingType[]) => void
}) => {
  const [selected, setSelected] = useState<ListingType[]>(value)
  const [homeTypes, setHomeTypes] = useState(cachedTypes || STATIC_TYPES.map((t) => ({ ...t, count: 0 })))
  const [loading, setLoading] = useState(!cachedTypes)

  useEffect(() => {
    if (cachedTypes) return
    let cancelled = false
    APIAggregates.getPropertyTypes().then((items) => {
      if (cancelled) return
      const mapped = mapAggregateToTypes(items)
      cachedTypes = mapped
      setHomeTypes(mapped)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

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

  const formatCount = (count: number) => {
    if (!count) return ''
    return ` (${count.toLocaleString()})`
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
      {loading ? (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={20} />
        </Stack>
      ) : (
        homeTypes.map((type) => (
          <FormControlLabel
            key={type.value}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(type.value)}
                onChange={() => toggle(type.value)}
              />
            }
            label={`${type.label}${formatCount(type.count)}`}
            slotProps={{ typography: { variant: 'body2' } }}
          />
        ))
      )}
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
