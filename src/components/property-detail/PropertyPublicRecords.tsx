'use client'

import React from 'react'

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography
} from '@mui/material'

import type { Property } from 'services/API'

interface PropertyPublicRecordsProps {
  property: Property
}

const PropertyPublicRecords: React.FC<PropertyPublicRecordsProps> = ({
  property
}) => {
  const rows: { label: string; value: string }[] = []

  if (property.details?.yearBuilt) {
    rows.push({ label: 'Year Built', value: property.details.yearBuilt })
  }
  if (property.details?.propertyType) {
    rows.push({ label: 'Property Type', value: property.details.propertyType })
  }
  if (property.details?.style) {
    rows.push({ label: 'Building Style', value: property.details.style })
  }
  if (property.details?.sqft) {
    rows.push({
      label: 'Total Living Area',
      value: `${Number(property.details.sqft).toLocaleString()} sq ft`
    })
  }
  if (property.details?.numBedrooms) {
    rows.push({ label: 'Bedrooms', value: property.details.numBedrooms })
  }
  if (property.details?.numBathrooms) {
    rows.push({ label: 'Bathrooms', value: property.details.numBathrooms })
  }
  if (property.details?.garage) {
    rows.push({ label: 'Garage', value: property.details.garage })
  }
  if (property.lot?.acres) {
    rows.push({ label: 'Lot Size (Acres)', value: String(property.lot.acres) })
  }
  if (property.lot?.depth && property.lot?.width) {
    rows.push({
      label: 'Lot Dimensions',
      value: `${property.lot.width} x ${property.lot.depth}`
    })
  }
  if (property.taxes?.annualAmount) {
    rows.push({
      label: 'Annual Tax Amount',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(property.taxes.annualAmount)
    })
  }
  if (property.taxes?.assessmentYear) {
    rows.push({
      label: 'Tax Assessment Year',
      value: String(property.taxes.assessmentYear)
    })
  }
  if (property.lot?.legalDescription) {
    rows.push({
      label: 'Legal Description',
      value: property.lot.legalDescription
    })
  }

  if (rows.length === 0) return null

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Public Records &amp; Property Facts
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    width: '40%'
                  }}
                >
                  {row.label}
                </TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PropertyPublicRecords
