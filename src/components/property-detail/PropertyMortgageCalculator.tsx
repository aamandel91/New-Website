'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Slider,
  Stack,
  Divider,
  InputAdornment,
  Grid
} from '@mui/material'

interface PropertyMortgageCalculatorProps {
  price: number
  defaultInterestRate?: number
  propertyTaxes?: number
  hoaFees?: number
}

const PropertyMortgageCalculator: React.FC<PropertyMortgageCalculatorProps> = ({
  price,
  defaultInterestRate = 7.0,
  propertyTaxes = 0,
  hoaFees = 0
}) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [interestRate, setInterestRate] = useState(defaultInterestRate)
  const [loanTerm, setLoanTerm] = useState(30)

  // Update interest rate when default changes (from backend)
  useEffect(() => {
    setInterestRate(defaultInterestRate)
  }, [defaultInterestRate])

  // Calculate mortgage values
  const downPaymentAmount = (price * downPaymentPercent) / 100
  const loanAmount = price - downPaymentAmount
  const monthlyInterestRate = interestRate / 100 / 12
  const numberOfPayments = loanTerm * 12

  // Monthly principal & interest payment formula
  const monthlyPI =
    loanAmount *
    (monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)

  // Additional monthly costs
  const monthlyPropertyTax = propertyTaxes / 12
  const monthlyHOA = hoaFees || 0

  // Total monthly payment
  const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyHOA

  const formatCurrency = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleDownPaymentChange = (event: Event, newValue: number | number[]) => {
    setDownPaymentPercent(newValue as number)
  }

  const handleInterestRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value)
    if (!isNaN(value) && value >= 0 && value <= 20) {
      setInterestRate(value)
    }
  }

  const handleLoanTermChange = (event: Event, newValue: number | number[]) => {
    setLoanTerm(newValue as number)
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Mortgage Calculator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Estimate your monthly mortgage payment
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Purchase Price */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Purchase Price
        </Typography>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          {formatCurrency(price)}
        </Typography>
      </Box>

      {/* Down Payment Slider */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Down Payment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {downPaymentPercent}% ({formatCurrency(downPaymentAmount)})
          </Typography>
        </Stack>
        <Slider
          value={downPaymentPercent}
          onChange={handleDownPaymentChange}
          aria-label="Down payment percentage"
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}%`}
          step={5}
          marks
          min={0}
          max={50}
          sx={{
            '& .MuiSlider-thumb': {
              backgroundColor: 'primary.main',
            },
            '& .MuiSlider-track': {
              backgroundColor: 'primary.main',
            },
            '& .MuiSlider-rail': {
              opacity: 0.3,
            },
          }}
        />
      </Box>

      {/* Interest Rate */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Interest Rate
        </Typography>
        <TextField
          type="number"
          value={interestRate}
          onChange={handleInterestRateChange}
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          inputProps={{
            step: 0.125,
            min: 0,
            max: 20,
          }}
        />
      </Box>

      {/* Loan Term Slider */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Loan Term
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loanTerm} years
          </Typography>
        </Stack>
        <Slider
          value={loanTerm}
          onChange={handleLoanTermChange}
          aria-label="Loan term in years"
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value} years`}
          step={5}
          marks={[
            { value: 10, label: '10' },
            { value: 15, label: '15' },
            { value: 20, label: '20' },
            { value: 30, label: '30' },
          ]}
          min={10}
          max={30}
          sx={{
            '& .MuiSlider-thumb': {
              backgroundColor: 'primary.main',
            },
            '& .MuiSlider-track': {
              backgroundColor: 'primary.main',
            },
            '& .MuiSlider-rail': {
              opacity: 0.3,
            },
          }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Monthly Payment Breakdown */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Estimated Monthly Payment
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Typography variant="body2" color="text.secondary">
              Principal & Interest
            </Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(monthlyPI)}
            </Typography>
          </Grid>

          {monthlyPropertyTax > 0 && (
            <>
              <Grid item xs={8}>
                <Typography variant="body2" color="text.secondary">
                  Property Taxes
                </Typography>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(monthlyPropertyTax)}
                </Typography>
              </Grid>
            </>
          )}

          {monthlyHOA > 0 && (
            <>
              <Grid item xs={8}>
                <Typography variant="body2" color="text.secondary">
                  HOA Fees
                </Typography>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(monthlyHOA)}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Total */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Total Monthly Payment
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {formatCurrency(totalMonthlyPayment)}
          </Typography>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: 'info.light',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'info.main',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          This calculator provides an estimate only. Your actual payment may vary based on
          insurance, additional fees, and lender requirements. Contact us for a detailed quote.
        </Typography>
      </Box>
    </Paper>
  )
}

export default PropertyMortgageCalculator
