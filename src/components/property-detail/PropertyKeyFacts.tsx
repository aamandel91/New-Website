'use client'

import React from 'react'
import { Box, Typography, Paper, Grid } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import TagIcon from '@mui/icons-material/Tag'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TerrainIcon from '@mui/icons-material/Terrain'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BusinessIcon from '@mui/icons-material/Business'

interface KeyFact {
  label: string
  value: string | number
  icon?: React.ReactNode
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
      label: 'MLS #',
      value: mlsNumber,
      icon: <TagIcon />,
    },
    ...(propertyType
      ? [
          {
            label: 'Property Type',
            value: propertyType,
            icon: <HomeIcon />,
          },
        ]
      : []),
    ...(status
      ? [
          {
            label: 'Status',
            value: status,
            icon: <BusinessIcon />,
          },
        ]
      : []),
    ...(yearBuilt
      ? [
          {
            label: 'Year Built',
            value: yearBuilt,
            icon: <CalendarTodayIcon />,
          },
        ]
      : []),
    ...(lotSize
      ? [
          {
            label: 'Lot Size',
            value: `${formatNumber(lotSize)} sqft`,
            icon: <TerrainIcon />,
          },
        ]
      : []),
    ...(pricePerSqft
      ? [
          {
            label: 'Price per Sq Ft',
            value: formatCurrency(pricePerSqft),
            icon: <AttachMoneyIcon />,
          },
        ]
      : []),
    ...(hoa
      ? [
          {
            label: 'HOA Dues',
            value: `${formatCurrency(hoa)}/month`,
            icon: <BusinessIcon />,
          },
        ]
      : []),
    ...(annualTaxes
      ? [
          {
            label: 'Annual Taxes',
            value: formatCurrency(annualTaxes),
            icon: <AttachMoneyIcon />,
          },
        ]
      : []),
  ]

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', mb: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Key Facts
      </Typography>

      <Grid container spacing={3}>
        {facts.map((fact, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  color: 'primary.main',
                  mt: 0.5,
                  '& svg': { fontSize: 20 },
                }}
              >
                {fact.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {fact.label}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {fact.value}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  )
}

export default PropertyKeyFacts
