'use client'

import React from 'react'

import { Box, Paper, Typography } from '@mui/material'

import type { HistoryItemType } from 'services/API'

import PropertyTransactionHistoryBody from './PropertyTransactionHistoryBody'

interface PropertyTransactionHistoryProps {
  history: HistoryItemType[]
}

const PropertyTransactionHistory: React.FC<PropertyTransactionHistoryProps> = ({
  history
}) => {
  if (!history || history.length === 0) return null

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">
          Property History
        </Typography>
      </Box>
      <PropertyTransactionHistoryBody history={history} />
    </Paper>
  )
}

export default PropertyTransactionHistory
