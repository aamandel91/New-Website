'use client'

import { type MouseEvent, useState } from 'react'

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import TuneIcon from '@mui/icons-material/Tune'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Popover,
  Stack,
  Typography
} from '@mui/material'

import type { ListingStatus, ListingType } from '@configs/filters'

import type { Filters } from 'services/Search'
import useBreakpoints from 'hooks/useBreakpoints'

import {
  BedsAndBathsPanel,
  HomeTypePanel,
  type MoreFiltersValues,
  MoreFiltersPanel,
  PricePanel,
  StatusPanel
} from './panels'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ZillowFilterState {
  listingStatus: ListingStatus
  minPrice: number
  maxPrice: number
  minBeds: number
  minBaths: number
  exactBedMatch: boolean
  homeTypes: ListingType[]
  more: Partial<MoreFiltersValues>
}

const defaultFilterState: ZillowFilterState = {
  listingStatus: 'active',
  minPrice: 0,
  maxPrice: 0,
  minBeds: 0,
  minBaths: 0,
  exactBedMatch: false,
  homeTypes: [],
  more: {}
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusLabels: Record<ListingStatus, string> = {
  active: 'For Sale',
  rent: 'For Rent',
  sold: 'Sold',
  all: 'All'
}

function getStatusLabel(s: ListingStatus) {
  return statusLabels[s] || 'For Sale'
}

function getPriceLabel(min: number, max: number) {
  if (!min && !max) return 'Price'
  if (min && !max) return `$${min.toLocaleString()}+`
  if (!min && max) return `Up to $${max.toLocaleString()}`
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`
}

function getBedsLabel(beds: number, baths: number) {
  const parts: string[] = []
  if (beds > 0) parts.push(`${beds}+ Beds`)
  if (baths > 0) parts.push(`${baths}+ Baths`)
  return parts.length ? parts.join(', ') : 'Beds & Baths'
}

function getHomeTypeLabel(types: ListingType[]) {
  if (!types.length) return 'Home Type'
  if (types.length === 1) {
    const labels: Partial<Record<ListingType, string>> = {
      residential: 'Houses',
      townhome: 'Townhomes',
      multiFamily: 'Multi-family',
      condo: 'Condos',
      land: 'Lots/Land'
    }
    return labels[types[0]] || 'Home Type'
  }
  return `${types.length} Types`
}

function hasActiveMore(more: Partial<MoreFiltersValues>) {
  if (!more) return false
  return Object.entries(more).some(([key, value]) => {
    if (key === 'keyword') return Boolean(value)
    if (typeof value === 'number') return value > 0
    if (typeof value === 'string') return value !== 'NA' && value !== ''
    return false
  })
}

/** Convert ZillowFilterState into the Filters shape the search provider expects */
export function toSearchFilters(state: ZillowFilterState): Partial<Filters> {
  const filters: Partial<Filters> = {
    listingStatus: state.listingStatus,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    minBeds: state.minBeds || undefined,
    minBaths: state.minBaths || undefined
  }

  // Home type mapping
  if (state.homeTypes.length === 1) {
    filters.listingType = state.homeTypes[0]
  } else if (state.homeTypes.length > 1) {
    // Multiple types — map to propertyType array for API
    filters.listingType = 'allListings'
  }

  // More filters
  const m = state.more
  if (m.minSqft) filters.minSqft = m.minSqft
  if (m.maxSqft) filters.maxSqft = m.maxSqft
  if (m.minYearBuilt) filters.minYearBuilt = m.minYearBuilt
  if (m.maxYearBuilt) filters.maxYearBuilt = m.maxYearBuilt
  if (m.minGarageSpaces) filters.minGarageSpaces = m.minGarageSpaces

  // Days on market mapping
  if (m.daysOnSite && m.daysOnSite !== 'NA') {
    const days = Number(m.daysOnSite)
    if (days === 1) filters.daysOnMarket = 'lastDay'
    else if (days <= 7) filters.daysOnMarket = 'lastWeek'
    else if (days <= 30) filters.daysOnMarket = 'lastMonth'
    else if (days <= 90) filters.daysOnMarket = 'last3Months'
    else if (days <= 180) filters.daysOnMarket = 'last6Months'
    else filters.daysOnMarket = 'lastYear'
  }

  // Open houses
  if (m.openHouses && m.openHouses !== 'NA') {
    filters.openHouses = true
    const today = new Date()
    filters.minOpenHouseDate = today.toISOString().split('T')[0]
  }

  // Price reduced
  if (m.priceReduced && m.priceReduced !== 'NA') {
    filters.priceReduced = true
  }

  // Keyword
  if (m.keyword) {
    filters.amenities = [m.keyword]
  }

  return filters
}

/** Build a ZillowFilterState from the SearchProvider's existing filters */
export function fromSearchFilters(filters: Partial<Filters>): ZillowFilterState {
  const homeTypes: ListingType[] = []
  if (filters.listingType && filters.listingType !== 'allListings') {
    homeTypes.push(filters.listingType)
  }

  return {
    listingStatus: filters.listingStatus || 'active',
    minPrice: filters.minPrice || 0,
    maxPrice: filters.maxPrice || 0,
    minBeds: filters.minBeds || 0,
    minBaths: filters.minBaths || 0,
    exactBedMatch: false,
    homeTypes,
    more: {
      minSqft: filters.minSqft || 0,
      maxSqft: filters.maxSqft || 0,
      minYearBuilt: filters.minYearBuilt ?? null,
      maxYearBuilt: filters.maxYearBuilt ?? null,
      minGarageSpaces: filters.minGarageSpaces || 0,
      priceReduced: filters.priceReduced ? '7days' : 'NA',
      openHouses: filters.openHouses ? 'weekend' : 'NA',
      keyword: ''
    }
  }
}

// ─── Popover Trigger Button ─────────────────────────────────────────────────

const FilterButton = ({
  label,
  active,
  onClick
}: {
  label: string
  active?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) => (
  <Button
    size="small"
    variant={active ? 'contained' : 'outlined'}
    onClick={onClick}
    endIcon={<KeyboardArrowDownIcon />}
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.8125rem',
      whiteSpace: 'nowrap',
      minWidth: 'auto',
      px: 1.5
    }}
  >
    {label}
  </Button>
)

// ─── Mobile Full-Screen Filters ─────────────────────────────────────────────

const MobileFiltersDialog = ({
  open,
  state,
  onClose,
  onApply
}: {
  open: boolean
  state: ZillowFilterState
  onClose: () => void
  onApply: (s: ZillowFilterState) => void
}) => {
  const [local, setLocal] = useState(state)

  const handleApply = () => {
    onApply(local)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Filters
        <Button onClick={onClose}>Close</Button>
      </DialogTitle>
      <DialogContent dividers sx={{ pb: 10 }}>
        <Stack spacing={3}>
          <StatusPanel
            value={local.listingStatus}
            onApply={(v) => setLocal((p) => ({ ...p, listingStatus: v }))}
          />
          <PricePanel
            minPrice={local.minPrice}
            maxPrice={local.maxPrice}
            onApply={(min, max) => setLocal((p) => ({ ...p, minPrice: min, maxPrice: max }))}
          />
          <BedsAndBathsPanel
            minBeds={local.minBeds}
            minBaths={local.minBaths}
            onApply={(beds, baths, exact) =>
              setLocal((p) => ({ ...p, minBeds: beds, minBaths: baths, exactBedMatch: exact }))
            }
          />
          <HomeTypePanel
            value={local.homeTypes}
            onApply={(types) => setLocal((p) => ({ ...p, homeTypes: types }))}
          />
          <MoreFiltersPanel
            initialValues={local.more}
            onApply={(values) => setLocal((p) => ({ ...p, more: values }))}
          />
        </Stack>
      </DialogContent>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Button variant="contained" fullWidth onClick={handleApply}>
          Show Results
        </Button>
      </Box>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

type AnchorKey = 'status' | 'price' | 'beds' | 'homeType' | 'more'

const ZillowFilterBar = ({
  filters,
  count,
  onFilterChange,
  saveSearchButton,
  autosuggestion
}: {
  filters: Partial<Filters>
  count?: number
  onFilterChange: (filters: Partial<Filters>) => void
  saveSearchButton?: React.ReactNode
  autosuggestion?: React.ReactNode
}) => {
  const { mobile } = useBreakpoints()
  const [state, setState] = useState<ZillowFilterState>(() =>
    fromSearchFilters(filters)
  )

  // Popover anchors
  const [anchors, setAnchors] = useState<
    Record<AnchorKey, HTMLButtonElement | null>
  >({
    status: null,
    price: null,
    beds: null,
    homeType: null,
    more: null
  })

  const [mobileOpen, setMobileOpen] = useState(false)

  const openPopover = (key: AnchorKey) => (e: MouseEvent<HTMLButtonElement>) =>
    setAnchors((prev) => ({ ...prev, [key]: e.currentTarget }))

  const closePopover = (key: AnchorKey) => () =>
    setAnchors((prev) => ({ ...prev, [key]: null }))

  const applyState = (next: ZillowFilterState) => {
    setState(next)
    onFilterChange(toSearchFilters(next))
  }

  // ── Mobile layout ──

  if (mobile) {
    return (
      <>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
          {autosuggestion && (
            <Box sx={{ flex: 1, minWidth: 0 }}>{autosuggestion}</Box>
          )}
          <IconButton onClick={() => setMobileOpen(true)} size="small">
            <TuneIcon />
          </IconButton>
          {count !== undefined && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {count.toLocaleString()}
            </Typography>
          )}
        </Stack>
        <MobileFiltersDialog
          open={mobileOpen}
          state={state}
          onClose={() => setMobileOpen(false)}
          onApply={applyState}
        />
      </>
    )
  }

  // ── Desktop layout ──

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ py: 1, flexWrap: 'nowrap', overflowX: 'auto' }}
    >
      {autosuggestion && (
        <Box sx={{ minWidth: 200, maxWidth: 320, flex: '0 1 320px' }}>
          {autosuggestion}
        </Box>
      )}

      {/* For Sale */}
      <FilterButton
        label={getStatusLabel(state.listingStatus)}
        active={state.listingStatus !== 'active'}
        onClick={openPopover('status')}
      />
      <Popover
        open={Boolean(anchors.status)}
        anchorEl={anchors.status}
        onClose={closePopover('status')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <StatusPanel
          value={state.listingStatus}
          onApply={(v) => {
            applyState({ ...state, listingStatus: v })
            closePopover('status')()
          }}
        />
      </Popover>

      {/* Price */}
      <FilterButton
        label={getPriceLabel(state.minPrice, state.maxPrice)}
        active={state.minPrice > 0 || state.maxPrice > 0}
        onClick={openPopover('price')}
      />
      <Popover
        open={Boolean(anchors.price)}
        anchorEl={anchors.price}
        onClose={closePopover('price')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <PricePanel
          minPrice={state.minPrice}
          maxPrice={state.maxPrice}
          onApply={(min, max) => {
            applyState({ ...state, minPrice: min, maxPrice: max })
            closePopover('price')()
          }}
        />
      </Popover>

      {/* Beds & Baths */}
      <FilterButton
        label={getBedsLabel(state.minBeds, state.minBaths)}
        active={state.minBeds > 0 || state.minBaths > 0}
        onClick={openPopover('beds')}
      />
      <Popover
        open={Boolean(anchors.beds)}
        anchorEl={anchors.beds}
        onClose={closePopover('beds')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <BedsAndBathsPanel
          minBeds={state.minBeds}
          minBaths={state.minBaths}
          onApply={(beds, baths, exact) => {
            applyState({
              ...state,
              minBeds: beds,
              minBaths: baths,
              exactBedMatch: exact
            })
            closePopover('beds')()
          }}
        />
      </Popover>

      {/* Home Type */}
      <FilterButton
        label={getHomeTypeLabel(state.homeTypes)}
        active={state.homeTypes.length > 0}
        onClick={openPopover('homeType')}
      />
      <Popover
        open={Boolean(anchors.homeType)}
        anchorEl={anchors.homeType}
        onClose={closePopover('homeType')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <HomeTypePanel
          value={state.homeTypes}
          onApply={(types) => {
            applyState({ ...state, homeTypes: types })
            closePopover('homeType')()
          }}
        />
      </Popover>

      {/* More */}
      <FilterButton
        label={hasActiveMore(state.more) ? 'More •' : 'More'}
        active={hasActiveMore(state.more)}
        onClick={openPopover('more')}
      />
      <Popover
        open={Boolean(anchors.more)}
        anchorEl={anchors.more}
        onClose={closePopover('more')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MoreFiltersPanel
          initialValues={state.more}
          onApply={(values) => {
            applyState({ ...state, more: values })
            closePopover('more')()
          }}
        />
      </Popover>

      {/* Save Search */}
      {saveSearchButton}

      {/* Count */}
      {count !== undefined && (
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          sx={{ ml: 'auto !important', flexShrink: 0 }}
        >
          {count.toLocaleString()} results
        </Typography>
      )}
    </Stack>
  )
}

export default ZillowFilterBar
