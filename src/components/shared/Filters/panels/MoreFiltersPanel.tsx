'use client'

import { useEffect, useState } from 'react'

import {
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import Select from 'components/atoms/PatchedSelect'

import type { AggregateItem } from 'services/API'
import { APIAggregates } from 'services/API'

export interface MoreFiltersValues {
  minSqft: number
  maxSqft: number
  minLotSize: number
  maxLotSize: number
  minYearBuilt: number | null
  maxYearBuilt: number | null
  minGarageSpaces: number
  maxGarageSpaces: number
  daysOnSite: string
  hoaFee: string
  seniorCommunity: string
  pool: string
  newConstruction: string
  waterfront: string
  gatedCommunity: string
  golfCourse: string
  firstFloorMaster: string
  openHouses: string
  priceReduced: string
  keyword: string
  cities: string[]
  neighborhoods: string[]
}

const defaultMore: MoreFiltersValues = {
  minSqft: 0,
  maxSqft: 0,
  minLotSize: 0,
  maxLotSize: 0,
  minYearBuilt: null,
  maxYearBuilt: null,
  minGarageSpaces: 0,
  maxGarageSpaces: 0,
  daysOnSite: 'NA',
  hoaFee: 'NA',
  seniorCommunity: 'NA',
  pool: 'NA',
  newConstruction: 'NA',
  waterfront: 'NA',
  gatedCommunity: 'NA',
  golfCourse: 'NA',
  firstFloorMaster: 'NA',
  openHouses: 'NA',
  priceReduced: 'NA',
  keyword: '',
  cities: [],
  neighborhoods: []
}

const yesNoItems = [
  { value: 'NA', label: 'Any' },
  { value: 'Yes', label: 'Yes' }
]

const hoaItems = [
  { value: 'NA', label: 'Any' },
  { value: 'None', label: 'None' },
  { value: '100', label: '$100/mo' },
  { value: '200', label: '$200/mo' },
  { value: '500', label: '$500/mo' },
  { value: '1000', label: '$1,000/mo' }
]

const openHouseItems = [
  { value: 'NA', label: 'Any' },
  { value: 'weekend', label: 'This Weekend' },
  { value: '7days', label: 'Next 7 Days' },
  { value: '14days', label: 'Next 14 Days' }
]

const priceReducedItems = [
  { value: 'NA', label: 'Any' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '14days', label: 'Last 14 Days' },
  { value: '30days', label: 'Last 30 Days' }
]

const daysOnSiteItems = [
  { value: 'NA', label: 'Any' },
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' }
]

let cachedCities: AggregateItem[] | null = null

const NumberRange = ({
  label,
  minVal,
  maxVal,
  onMinChange,
  onMaxChange
}: {
  label: string
  minVal: number | null
  maxVal: number | null
  onMinChange: (v: number | null) => void
  onMaxChange: (v: number | null) => void
}) => (
  <Stack spacing={0.5}>
    <Typography variant="body2" fontWeight={600}>
      {label}
    </Typography>
    <Stack direction="row" spacing={1}>
      <TextField
        size="small"
        type="number"
        placeholder="Min"
        value={minVal || ''}
        onChange={(e) => onMinChange(Number(e.target.value) || 0)}
        sx={{ flex: 1 }}
      />
      <TextField
        size="small"
        type="number"
        placeholder="Max"
        value={maxVal || ''}
        onChange={(e) => onMaxChange(Number(e.target.value) || 0)}
        sx={{ flex: 1 }}
      />
    </Stack>
  </Stack>
)

const DropdownField = ({
  label,
  value,
  items,
  onChange
}: {
  label: string
  value: string
  items: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) => (
  <Stack spacing={0.5}>
    <Typography variant="body2" fontWeight={600}>
      {label}
    </Typography>
    <Select
      size="small"
      value={value}
      variant="outlined"
      onChange={(e: any) => onChange(e.target.value)}
      sx={{ minWidth: 120 }}
    >
      {items.map((item) => (
        <MenuItem key={item.value} value={item.value}>
          {item.label}
        </MenuItem>
      ))}
    </Select>
  </Stack>
)

const MoreFiltersPanel = ({
  initialValues,
  onApply
}: {
  initialValues?: Partial<MoreFiltersValues>
  onApply: (values: MoreFiltersValues) => void
}) => {
  const [state, setState] = useState<MoreFiltersValues>({
    ...defaultMore,
    ...initialValues
  })

  const [cityOptions, setCityOptions] = useState<AggregateItem[]>(
    cachedCities || []
  )
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<
    AggregateItem[]
  >([])
  const [loadingCities, setLoadingCities] = useState(!cachedCities)
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false)

  useEffect(() => {
    if (cachedCities) return
    let cancelled = false
    APIAggregates.getCities()
      .then((items) => {
        if (cancelled) return
        cachedCities = items
        setCityOptions(items)
        setLoadingCities(false)
      })
      .catch(() => {
        if (!cancelled) setLoadingCities(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (state.cities.length === 0) {
      setNeighborhoodOptions([])
      return
    }
    let cancelled = false
    setLoadingNeighborhoods(true)
    // Fetch neighborhoods for the first selected city
    APIAggregates.getNeighborhoods(state.cities[0])
      .then((items) => {
        if (cancelled) return
        setNeighborhoodOptions(items)
        setLoadingNeighborhoods(false)
      })
      .catch(() => {
        if (!cancelled) setLoadingNeighborhoods(false)
      })
    return () => {
      cancelled = true
    }
  }, [state.cities])

  const set = <K extends keyof MoreFiltersValues>(
    key: K,
    value: MoreFiltersValues[K]
  ) => setState((prev) => ({ ...prev, [key]: value }))

  return (
    <Stack
      spacing={2}
      sx={{
        p: 2,
        minWidth: 480,
        maxWidth: 560,
        maxHeight: 540,
        overflow: 'auto'
      }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        More Filters
      </Typography>

      <Grid container spacing={2}>
        {/* City Multi-Select */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              City
            </Typography>
            <Autocomplete
              multiple
              size="small"
              loading={loadingCities}
              options={cityOptions.map((c) => c.name)}
              value={state.cities}
              onChange={(_, val) => set('cities', val)}
              renderTags={(val, getTagProps) =>
                val.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip key={key} label={option} size="small" {...tagProps} />
                  )
                })
              }
              renderOption={(props, option) => {
                const { key, ...rest } = props as any
                const item = cityOptions.find((c) => c.name === option)
                return (
                  <li key={key} {...rest}>
                    {option} {item ? `(${item.count.toLocaleString()})` : ''}
                  </li>
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select cities"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCities && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }
                  }}
                />
              )}
            />
          </Stack>
        </Grid>

        {/* Neighborhood Multi-Select */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Neighborhood
            </Typography>
            <Autocomplete
              multiple
              size="small"
              loading={loadingNeighborhoods}
              options={neighborhoodOptions.map((n) => n.name)}
              value={state.neighborhoods}
              onChange={(_, val) => set('neighborhoods', val)}
              disabled={state.cities.length === 0}
              renderTags={(val, getTagProps) =>
                val.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip key={key} label={option} size="small" {...tagProps} />
                  )
                })
              }
              renderOption={(props, option) => {
                const { key, ...rest } = props as any
                const item = neighborhoodOptions.find((n) => n.name === option)
                return (
                  <li key={key} {...rest}>
                    {option} {item ? `(${item.count.toLocaleString()})` : ''}
                  </li>
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    state.cities.length === 0
                      ? 'Select a city first'
                      : 'Select neighborhoods'
                  }
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingNeighborhoods && (
                            <CircularProgress size={16} />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }
                  }}
                />
              )}
            />
          </Stack>
        </Grid>

        {/* Row 1 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberRange
            label="Square Feet"
            minVal={state.minSqft}
            maxVal={state.maxSqft}
            onMinChange={(v) => set('minSqft', v || 0)}
            onMaxChange={(v) => set('maxSqft', v || 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberRange
            label="Lot Size (Acres)"
            minVal={state.minLotSize}
            maxVal={state.maxLotSize}
            onMinChange={(v) => set('minLotSize', v || 0)}
            onMaxChange={(v) => set('maxLotSize', v || 0)}
          />
        </Grid>

        {/* Row 2 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberRange
            label="Year Built"
            minVal={state.minYearBuilt}
            maxVal={state.maxYearBuilt}
            onMinChange={(v) => set('minYearBuilt', v)}
            onMaxChange={(v) => set('maxYearBuilt', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberRange
            label="Garage Spaces"
            minVal={state.minGarageSpaces}
            maxVal={state.maxGarageSpaces}
            onMinChange={(v) => set('minGarageSpaces', v || 0)}
            onMaxChange={(v) => set('maxGarageSpaces', v || 0)}
          />
        </Grid>

        {/* Row 3 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Days on Site"
            value={state.daysOnSite}
            items={daysOnSiteItems}
            onChange={(v) => set('daysOnSite', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="HOA Fee"
            value={state.hoaFee}
            items={hoaItems}
            onChange={(v) => set('hoaFee', v)}
          />
        </Grid>

        {/* Row 4 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Senior Community"
            value={state.seniorCommunity}
            items={yesNoItems}
            onChange={(v) => set('seniorCommunity', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Pool"
            value={state.pool}
            items={yesNoItems}
            onChange={(v) => set('pool', v)}
          />
        </Grid>

        {/* Row 5 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="New Construction"
            value={state.newConstruction}
            items={yesNoItems}
            onChange={(v) => set('newConstruction', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Waterfront"
            value={state.waterfront}
            items={yesNoItems}
            onChange={(v) => set('waterfront', v)}
          />
        </Grid>

        {/* Row 6 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Gated Community"
            value={state.gatedCommunity}
            items={yesNoItems}
            onChange={(v) => set('gatedCommunity', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Golf Course"
            value={state.golfCourse}
            items={yesNoItems}
            onChange={(v) => set('golfCourse', v)}
          />
        </Grid>

        {/* Row 7 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="First Floor Master"
            value={state.firstFloorMaster}
            items={yesNoItems}
            onChange={(v) => set('firstFloorMaster', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Open Houses"
            value={state.openHouses}
            items={openHouseItems}
            onChange={(v) => set('openHouses', v)}
          />
        </Grid>

        {/* Row 8 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <DropdownField
            label="Price Reduced"
            value={state.priceReduced}
            items={priceReducedItems}
            onChange={(v) => set('priceReduced', v)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Keyword
            </Typography>
            <TextField
              size="small"
              placeholder="e.g. pool, waterfront"
              value={state.keyword}
              onChange={(e) => set('keyword', e.target.value)}
            />
          </Stack>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        size="small"
        fullWidth
        onClick={() => onApply(state)}
      >
        Apply
      </Button>
    </Stack>
  )
}

export default MoreFiltersPanel
