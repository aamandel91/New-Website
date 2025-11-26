'use client'

import React from 'react'
import { Box, Typography, Paper, Grid, Divider } from '@mui/material'

interface KeyFact {
  label: string
  value: string | number
}

interface PropertyKeyFactsProps {
  mlsNumber: string
  propertyType?: string
  status?: string
  yearBuilt?: number
  lotSize?: number
  pricePerSqft?: number
  hoa?: number
  annualTaxes?: number
  daysOnMarket?: number
}

const PropertyKeyFacts: React.FC<PropertyKeyFactsProps> = ({
  mlsNumber,
  propertyType,
  status,
  yearBuilt,
  lotSize,
  pricePerSqft,
  hoa,
  annualTaxes,
  daysOnMarket,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const facts: KeyFact[] = [
    {
      label: 'MLS Number',
      value: mlsNumber,
    },
    ...(propertyType
      ? [
          {
            label: 'Property Type',
            value: propertyType,
          },
        ]
      : []),
    ...(status
      ? [
          {
            label: 'Status',
            value: status,
          },
        ]
      : []),
    ...(yearBuilt
      ? [
          {
            label: 'Year Built',
            value: yearBuilt,
          },
        ]
      : []),
    ...(daysOnMarket
      ? [
          {
            label: 'Days on Market',
            value: daysOnMarket,
          },
        ]
      : []),
    ...(lotSize
      ? [
          {
            label: 'Lot Size',
            value: `${formatNumber(lotSize)} sqft`,
          },
        ]
      : []),
    ...(pricePerSqft
      ? [
          {
            label: 'Price per Sq Ft',
            value: formatCurrency(pricePerSqft),
          },
        ]
      : []),
    ...(hoa
      ? [
          {
            label: 'HOA Fees',
            value: `${formatCurrency(hoa)}/month`,
          },
        ]
      : []),
    ...(annualTaxes
      ? [
          {
            label: 'Annual Property Taxes',
            value: formatCurrency(annualTaxes),
          },
        ]
      : []),
  ]

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
        Property Details
      </Typography>

      <Box>
        {facts.map((fact, index) => (
          <React.Fragment key={index}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                px: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                {fact.label}
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {fact.value}
              </Typography>
            </Box>
            {index < facts.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  )
}

export default PropertyKeyFacts
