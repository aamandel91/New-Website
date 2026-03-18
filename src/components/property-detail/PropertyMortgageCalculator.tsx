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
  Grid,
  Button,
} from '@mui/material'

interface PropertyMortgageCalculatorProps {
  price: number
  defaultInterestRate?: number
  propertyTaxes?: number
  hoaMonthly?: number
}

// SVG donut chart component
const DonutChart: React.FC<{
  segments: { label: string; value: number; color: string }[]
  total: number
}> = ({ segments, total }) => {
  const size = 180
  const strokeWidth = 32
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let cumulativeOffset = 0

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments
          .filter((s) => s.value > 0)
          .map((segment, i) => {
            const ratio = total > 0 ? segment.value / total : 0
            const dashLength = circumference * ratio
            const dashOffset = circumference * cumulativeOffset
            cumulativeOffset += ratio
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            )
          })}
      </svg>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {segments
          .filter((s) => s.value > 0)
          .map((segment, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: segment.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {segment.label}
              </Typography>
            </Box>
          ))}
      </Box>
    </Box>
  )
}

const PropertyMortgageCalculator: React.FC<PropertyMortgageCalculatorProps> = ({
  price,
  defaultInterestRate = 7.0,
  propertyTaxes = 0,
  hoaMonthly = 0,
}) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [interestRate, setInterestRate] = useState(defaultInterestRate)
  const [loanTerm, setLoanTerm] = useState(30)
  const [annualInsurance, setAnnualInsurance] = useState(Math.round(price * 0.005))
  const [annualTaxes, setAnnualTaxes] = useState(propertyTaxes)
  const [monthlyHOA, setMonthlyHOA] = useState(hoaMonthly)

  // Update when defaults change
  useEffect(() => {
    setInterestRate(defaultInterestRate)
  }, [defaultInterestRate])

  useEffect(() => {
    setAnnualTaxes(propertyTaxes)
  }, [propertyTaxes])

  useEffect(() => {
    setMonthlyHOA(hoaMonthly)
  }, [hoaMonthly])

  // Calculate mortgage values
  const downPaymentAmount = (price * downPaymentPercent) / 100
  const loanAmount = price - downPaymentAmount
  const monthlyInterestRate = interestRate / 100 / 12
  const numberOfPayments = loanTerm * 12

  // Monthly principal & interest payment formula
  const monthlyPI =
    monthlyInterestRate > 0
      ? loanAmount *
        (monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : loanAmount / numberOfPayments

  // Additional monthly costs
  const monthlyPropertyTax = annualTaxes / 12
  const monthlyInsurance = annualInsurance / 12

  // Total monthly payment
  const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyHOA

  const needsPMI = downPaymentPercent < 20

  const formatCurrency = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleDownPaymentChange = (_event: Event, newValue: number | number[]) => {
    setDownPaymentPercent(newValue as number)
  }

  const handleInterestRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value)
    if (!isNaN(value) && value >= 0 && value <= 20) {
      setInterestRate(value)
    }
  }

  const handleLoanTermChange = (_event: Event, newValue: number | number[]) => {
    setLoanTerm(newValue as number)
  }

  // Donut chart segments
  const chartSegments = [
    { label: 'Principal & Interest', value: monthlyPI, color: '#1976d2' },
    { label: 'Property Taxes', value: monthlyPropertyTax, color: '#2e7d32' },
    { label: 'Home Insurance', value: monthlyInsurance, color: '#ed6c02' },
    { label: 'HOA', value: monthlyHOA, color: '#9c27b0' },
  ]

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
            '& .MuiSlider-thumb': { backgroundColor: 'primary.main' },
            '& .MuiSlider-track': { backgroundColor: 'primary.main' },
            '& .MuiSlider-rail': { opacity: 0.3 },
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
          inputProps={{ step: 0.125, min: 0, max: 20 }}
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
            '& .MuiSlider-thumb': { backgroundColor: 'primary.main' },
            '& .MuiSlider-track': { backgroundColor: 'primary.main' },
            '& .MuiSlider-rail': { opacity: 0.3 },
          }}
        />
      </Box>

      {/* Home Insurance */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Home Insurance (annual)
        </Typography>
        <TextField
          type="number"
          value={annualInsurance}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (!isNaN(val) && val >= 0) setAnnualInsurance(val)
          }}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          inputProps={{ step: 100, min: 0 }}
        />
      </Box>

      {/* Property Taxes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Property Taxes (annual)
        </Typography>
        <TextField
          type="number"
          value={annualTaxes}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (!isNaN(val) && val >= 0) setAnnualTaxes(val)
          }}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          inputProps={{ step: 100, min: 0 }}
        />
      </Box>

      {/* HOA */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          HOA (monthly)
        </Typography>
        <TextField
          type="number"
          value={monthlyHOA}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (!isNaN(val) && val >= 0) setMonthlyHOA(val)
          }}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          inputProps={{ step: 50, min: 0 }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Donut Chart */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <DonutChart segments={chartSegments} total={totalMonthlyPayment} />
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

          {monthlyInsurance > 0 && (
            <>
              <Grid item xs={8}>
                <Typography variant="body2" color="text.secondary">
                  Home Insurance
                </Typography>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(monthlyInsurance)}
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

      {/* PMI Note */}
      {needsPMI && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'warning.light',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        >
          <Typography variant="caption" color="text.primary">
            With less than 20% down, you may be required to pay Private Mortgage Insurance (PMI),
            which could add $50–$300+/mo depending on your loan amount and credit score.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'info.light',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'info.main',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          This calculator provides an estimate only. Your actual payment may vary based on
          additional fees and lender requirements. Contact us for a detailed quote.
        </Typography>
      </Box>

      {/* Get Pre-Qualified CTA */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        href="#contact-form"
        sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
      >
        Get Pre-Qualified
      </Button>
    </Paper>
  )
}

export default PropertyMortgageCalculator
