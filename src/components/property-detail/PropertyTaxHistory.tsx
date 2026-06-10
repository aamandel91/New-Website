'use client'

import React from 'react'

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography
} from '@mui/material'

interface PropertyTaxHistoryProps {
  taxes?: {
    annualAmount: number
    assessmentYear: number
  }
}

const PropertyTaxHistory: React.FC<PropertyTaxHistoryProps> = ({ taxes }) => {
  if (!taxes || !taxes.annualAmount) return null

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const monthlyTax = taxes.annualAmount / 12

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tax Information
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 500,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                Assessment Year
              </TableCell>
              <TableCell
                align="right"
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                {taxes.assessmentYear}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 500,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                Annual Tax
              </TableCell>
              <TableCell
                align="right"
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                {formatCurrency(taxes.annualAmount)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 500, borderBottom: 0 }}>
                Monthly Tax
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: 0 }}>
                {formatCurrency(monthlyTax)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PropertyTaxHistory
