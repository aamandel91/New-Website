'use client'

import React from 'react'

import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import type { HistoryItemType, ListingLastStatus } from 'services/API'
import { listingLastStatusMapping } from 'services/API'

function formatPrice(price: number | string | null | undefined): string {
  if (price == null) return '—'
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num) || num === 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function getEventLabel(item: HistoryItemType): string {
  if (item.lastStatus === 'Sld' || item.soldDate) return 'Sold'
  if (item.lastStatus === 'New') return 'Listed for Sale'
  if (item.lastStatus === 'Pc') return 'Price Change'
  if (item.lastStatus === 'Exp') return 'Expired'
  if (item.lastStatus === 'Ter') return 'Terminated'
  if (item.lastStatus === 'Sus') return 'Suspended'
  if (item.lastStatus === 'Dft') return 'Deal Fell Through'
  return (
    listingLastStatusMapping[item.lastStatus as ListingLastStatus] || 'Listed'
  )
}

function getEventColor(
  lastStatus: string
): 'success' | 'warning' | 'info' | 'error' | 'default' {
  switch (lastStatus) {
    case 'Sld':
      return 'success'
    case 'New':
      return 'info'
    case 'Pc':
      return 'warning'
    case 'Exp':
    case 'Ter':
    case 'Dft':
      return 'error'
    default:
      return 'default'
  }
}

function getEventDate(item: HistoryItemType): string {
  if (item.soldDate) return formatDate(item.soldDate)
  if (item.timestamps?.closedDate) return formatDate(item.timestamps.closedDate)
  if (item.listDate) return formatDate(item.listDate)
  if (item.timestamps?.listingEntryDate)
    return formatDate(item.timestamps.listingEntryDate)
  return '—'
}

function getEventPrice(item: HistoryItemType): string {
  if (item.soldPrice != null && item.soldPrice !== 0)
    return formatPrice(item.soldPrice)
  return formatPrice(item.listPrice)
}

interface PropertyTransactionHistoryBodyProps {
  history: HistoryItemType[]
}

const PropertyTransactionHistoryBody: React.FC<
  PropertyTransactionHistoryBodyProps
> = ({ history }) => {
  if (!history || history.length === 0) return null

  // Sort by date, newest first
  const sorted = [...history].sort((a, b) => {
    const dateA =
      a.soldDate || a.listDate || a.timestamps?.listingEntryDate || ''
    const dateB =
      b.soldDate || b.listDate || b.timestamps?.listingEntryDate || ''
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Event</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
              Source
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((item, index) => (
            <TableRow key={`${item.mlsNumber}-${item.lastStatus}-${index}`}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getEventDate(item)}
              </TableCell>
              <TableCell>
                <Chip
                  label={getEventLabel(item)}
                  size="small"
                  color={getEventColor(item.lastStatus)}
                  variant="outlined"
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {getEventPrice(item)}
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                {item.office?.brokerageName || 'Florida MLS'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default PropertyTransactionHistoryBody
