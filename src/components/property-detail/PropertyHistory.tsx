'use client'

import React from 'react'

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import type { HistoryItemType, ListingLastStatus } from 'services/API/types'
import { listingLastStatusMapping } from 'services/API/types'

interface PropertyHistoryProps {
  history?: HistoryItemType[]
  currentPrice?: number
  originalPrice?: number
  listDate?: string
  sqft?: number
  address?: string
}

const PropertyHistory: React.FC<PropertyHistoryProps> = ({
  history,
  currentPrice,
  originalPrice,
  listDate,
  sqft,
  address
}) => {
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price == null) return '—'
    const num = typeof price === 'number' ? price : parseFloat(price)
    if (isNaN(num)) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getEventLabel = (status: ListingLastStatus): string => {
    return listingLastStatusMapping[status] || status
  }

  const getRowDate = (item: HistoryItemType): string => {
    if (item.lastStatus === 'Sld' && item.soldDate) return item.soldDate
    return item.listDate
  }

  const getRowPrice = (item: HistoryItemType): number | string | null => {
    if (item.lastStatus === 'Sld' && item.soldPrice != null)
      return item.soldPrice
    return item.listPrice
  }

  const getPricePerSqft = (
    price: number | string | null | undefined
  ): string => {
    if (!sqft || !price) return '—'
    const num = typeof price === 'number' ? price : parseFloat(String(price))
    if (isNaN(num)) return '—'
    return `$${Math.round(num / sqft).toLocaleString()}`
  }

  if (!history || history.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          {address ? `Price History for ${address}` : 'Price History'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No price history available
        </Typography>
      </Box>
    )
  }

  // Sort by date descending
  const sorted = [...history].sort((a, b) => {
    const dateA = new Date(getRowDate(a)).getTime()
    const dateB = new Date(getRowDate(b)).getTime()
    return dateB - dateA
  })

  // Calculate price changes between consecutive entries
  const getPriceChange = (
    item: HistoryItemType,
    index: number
  ): { direction: 'up' | 'down' | null; amount: number } => {
    const currentRowPrice = getRowPrice(item)
    const currentNum =
      typeof currentRowPrice === 'number'
        ? currentRowPrice
        : parseFloat(String(currentRowPrice))
    if (isNaN(currentNum)) return { direction: null, amount: 0 }

    // Compare with next entry (older, since sorted descending)
    const nextItem = sorted[index + 1]
    if (!nextItem) return { direction: null, amount: 0 }

    const prevPrice = getRowPrice(nextItem)
    const prevNum =
      typeof prevPrice === 'number' ? prevPrice : parseFloat(String(prevPrice))
    if (isNaN(prevNum) || prevNum === 0) return { direction: null, amount: 0 }

    const diff = currentNum - prevNum
    if (diff === 0) return { direction: null, amount: 0 }
    return {
      direction: diff > 0 ? 'up' : 'down',
      amount: Math.abs(diff)
    }
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
        {address ? `Price History for ${address}` : 'Price History'}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Price
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                $/Sq Ft
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((item, index) => {
              const rowPrice = getRowPrice(item)
              const change = getPriceChange(item, index)
              return (
                <TableRow
                  key={`${item.mlsNumber}-${index}`}
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(getRowDate(item))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getEventLabel(item.lastStatus)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {formatPrice(rowPrice)}
                      </Typography>
                      {change.direction === 'down' && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'success.main' }}
                        >
                          ▼
                        </Typography>
                      )}
                      {change.direction === 'up' && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'error.main' }}
                        >
                          ▲
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {getPricePerSqft(rowPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ maxWidth: 200 }}
                    >
                      {item.office?.brokerageName || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PropertyHistory
