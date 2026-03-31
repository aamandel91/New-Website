'use client'

import { Chip, Stack } from '@mui/material'
import dayjs from 'dayjs'

import type { Property } from 'services/API'
import { active, sold } from 'utils/properties'

type Badge = {
  label: string
  color: 'success' | 'warning' | 'error' | 'info' | 'secondary'
  priority: number
}

function hasUpcomingOpenHouse(property: Property): boolean {
  const { openHouse } = property
  if (!openHouse) return false
  const now = dayjs()
  return Object.values(openHouse).some((entry) => {
    // The API type declares date as null, but real data may contain strings
    const date = entry.date as string | null
    if (!date) return false
    return dayjs(date).isAfter(now.subtract(1, 'day'))
  })
}

function isUnderContract(property: Property): boolean {
  const { status, lastStatus } = property
  if (status === 'U') return true
  return ['Sc', 'Sce', 'Lc'].includes(lastStatus)
}

function isNewListing(property: Property): boolean {
  const { listDate } = property
  if (!listDate) return false
  return dayjs().diff(dayjs(listDate), 'day') <= 7
}

function isPriceReduced(property: Property): boolean {
  const list = Number(property.listPrice)
  const original = Number(property.originalPrice)
  return original > 0 && list > 0 && list < original
}

function isSold(property: Property): boolean {
  return sold(property) || ['Sld', 'Lsd'].includes(property.lastStatus)
}

export function getListingBadges(property: Property): Badge[] {
  const badges: Badge[] = []

  if (isSold(property)) {
    badges.push({ label: 'SOLD', color: 'secondary', priority: 100 })
  }

  if (hasUpcomingOpenHouse(property) && active(property)) {
    badges.push({ label: 'OPEN HOUSE', color: 'success', priority: 90 })
  }

  if (isUnderContract(property) && !isSold(property)) {
    badges.push({ label: 'UNDER CONTRACT', color: 'warning', priority: 85 })
  }

  if (isPriceReduced(property) && active(property)) {
    badges.push({ label: 'PRICE REDUCED', color: 'error', priority: 80 })
  }

  if (isNewListing(property) && active(property) && !isSold(property)) {
    badges.push({ label: 'NEW', color: 'info', priority: 75 })
  }

  return badges.sort((a, b) => b.priority - a.priority).slice(0, 3)
}

const ListingBadges = ({ property }: { property: Property }) => {
  const badges = getListingBadges(property)

  if (!badges.length) return null

  return (
    <Stack
      spacing={0.5}
      alignItems="flex-start"
      sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
    >
      {badges.map((badge) => (
        <Chip
          key={badge.label}
          label={badge.label}
          variant="filled"
          size="small"
          sx={{
            '& .MuiChip-label': { px: 1 },
            p: 0,
            height: 22,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
            borderRadius: 1,
            bgcolor: `${badge.color}.main`,
            color: 'common.white'
          }}
        />
      ))}
    </Stack>
  )
}

export default ListingBadges
