'use client'

import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import CalendarIcon from '@mui/icons-material/CalendarToday'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

import { type Property } from 'services/API'
import { formatEnglishPrice } from 'utils/formatters'
import { formatFullAddress } from 'utils/properties'

interface PropertyComparablesProps {
  comparables: Partial<Property>[]
  currentProperty: Property
}

const PropertyComparables: React.FC<PropertyComparablesProps> = ({
  comparables,
  currentProperty,
}) => {
  if (!comparables || comparables.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comparable Sales
        </Typography>
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No comparable sales data is currently available for this property.
          </Typography>
        </Box>
      </Paper>
    )
  }

  const currentPrice = typeof currentProperty.listPrice === 'string' ?
    parseFloat(currentProperty.listPrice) :
    currentProperty.listPrice || 0

  const calculatePriceDifference = (compPrice: string | number | undefined) => {
    if (!compPrice) return null
    const price = typeof compPrice === 'string' ? parseFloat(compPrice) : compPrice
    if (price === 0 || currentPrice === 0) return null
    const diff = ((price - currentPrice) / currentPrice) * 100
    return diff
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Comparable Sales
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        These properties are similar to the current listing and can help you understand market value.
      </Typography>

      {/* Card View for Mobile/Tablet */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
        <Grid container spacing={2}>
          {comparables.slice(0, 6).map((comp, index) => {
            const soldPrice = comp.soldPrice ?
              (typeof comp.soldPrice === 'string' ? parseFloat(comp.soldPrice) : comp.soldPrice) :
              null
            const listPrice = comp.listPrice ?
              (typeof comp.listPrice === 'string' ? parseFloat(comp.listPrice) : comp.listPrice) :
              null
            const price = soldPrice || listPrice || 0
            const priceDiff = calculatePriceDifference(price)

            return (
              <Grid item xs={12} key={index}>
                <Card>
                  {comp.images && comp.images.length > 0 && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={comp.images[0]}
                      alt={comp.address ? formatFullAddress(comp.address) : 'Property'}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {formatEnglishPrice(price)}
                      {priceDiff !== null && (
                        <Chip
                          size="small"
                          icon={priceDiff > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          label={`${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}%`}
                          color={priceDiff > 0 ? 'success' : 'error'}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    {comp.address && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatFullAddress(comp.address)}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      {comp.details?.numBedrooms && (
                        <Typography variant="caption">
                          {comp.details.numBedrooms} Beds
                        </Typography>
                      )}
                      {comp.details?.numBathrooms && (
                        <Typography variant="caption">
                          {comp.details.numBathrooms} Baths
                        </Typography>
                      )}
                      {comp.details?.sqft && (
                        <Typography variant="caption">
                          {parseInt(comp.details.sqft).toLocaleString()} sqft
                        </Typography>
                      )}
                    </Stack>
                    {comp.status && (
                      <Chip
                        label={comp.status}
                        size="small"
                        color={comp.status.toLowerCase() === 'sold' ? 'success' : 'default'}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      {/* Table View for Desktop */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Address</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">vs Current</TableCell>
              <TableCell align="center">Beds</TableCell>
              <TableCell align="center">Baths</TableCell>
              <TableCell align="center">Sq Ft</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comparables.slice(0, 10).map((comp, index) => {
              const soldPrice = comp.soldPrice ?
                (typeof comp.soldPrice === 'string' ? parseFloat(comp.soldPrice) : comp.soldPrice) :
                null
              const listPrice = comp.listPrice ?
                (typeof comp.listPrice === 'string' ? parseFloat(comp.listPrice) : comp.listPrice) :
                null
              const price = soldPrice || listPrice || 0
              const priceDiff = calculatePriceDifference(price)

              return (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {comp.address ? formatFullAddress(comp.address) : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatEnglishPrice(price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {priceDiff !== null ? (
                      <Chip
                        size="small"
                        icon={priceDiff > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        label={`${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}%`}
                        color={priceDiff > 0 ? 'success' : 'error'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {comp.details?.numBedrooms || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {comp.details?.numBathrooms || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {comp.details?.sqft ? parseInt(comp.details.sqft).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {comp.status ? (
                      <Chip
                        label={comp.status}
                        size="small"
                        color={comp.status.toLowerCase() === 'sold' ? 'success' : 'default'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        * Comparables are automatically selected based on similar location, size, and features.
      </Typography>
    </Box>
  )
}

export default PropertyComparables
