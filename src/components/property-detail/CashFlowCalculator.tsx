'use client'

import React, { useMemo, useState } from 'react'

import {
  Box,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography
} from '@mui/material'

interface CashFlowCalculatorProps {
  listPrice: number
  propertyTaxAnnual?: number
  hoaMonthly?: number
}

const COLORS = {
  mortgage: '#1976d2',
  tax: '#2e7d32',
  insurance: '#ed6c02',
  hoa: '#9c27b0',
  maintenance: '#00838f',
  other: '#546e7a',
  income: '#43a047'
}

const formatCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const CashFlowDonut: React.FC<{
  segments: { label: string; value: number; color: string }[]
  total: number
  centerLabel: string
  centerValue: string
  centerColor: string
}> = ({ segments, total, centerLabel, centerValue, centerColor }) => {
  const size = 200
  const strokeWidth = 30
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let cumulativeOffset = 0

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
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
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          fontSize="12"
          fill="#666"
        >
          {centerLabel}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill={centerColor}
        >
          {centerValue}
        </text>
      </svg>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center'
        }}
      >
        {segments
          .filter((s) => s.value > 0)
          .map((segment, i) => (
            <Box
              key={i}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: segment.color,
                  flexShrink: 0
                }}
              />
              <Typography variant="caption" color="text.secondary" noWrap>
                {segment.label}: {formatCurrency(segment.value)}
              </Typography>
            </Box>
          ))}
      </Box>
    </Box>
  )
}

const CashFlowCalculator: React.FC<CashFlowCalculatorProps> = ({
  listPrice,
  propertyTaxAnnual = 0,
  hoaMonthly = 0
}) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [interestRate, setInterestRate] = useState(7.0)
  const [loanTerm, setLoanTerm] = useState(30)
  const [maintenanceCost, setMaintenanceCost] = useState(0)
  const [insuranceMonthly, setInsuranceMonthly] = useState(0)
  const [hoaCost, setHoaCost] = useState(hoaMonthly)
  const [otherCosts, setOtherCosts] = useState(0)
  const [rentalIncome, setRentalIncome] = useState(0)
  const [propertyTaxMonthly, setPropertyTaxMonthly] = useState(
    Math.round(propertyTaxAnnual / 12)
  )

  const calculations = useMemo(() => {
    const downPaymentAmount = (listPrice * downPaymentPercent) / 100
    const loanAmount = listPrice - downPaymentAmount
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTerm * 12

    const mortgagePayment =
      monthlyRate > 0
        ? (loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
          (Math.pow(1 + monthlyRate, numPayments) - 1)
        : loanAmount / numPayments

    const totalExpenses =
      mortgagePayment +
      propertyTaxMonthly +
      maintenanceCost +
      insuranceMonthly +
      hoaCost +
      otherCosts

    const monthlyCashFlow = rentalIncome - totalExpenses
    const annualCashFlow = monthlyCashFlow * 12

    const annualRentalIncome = rentalIncome * 12
    const annualExpenses = totalExpenses * 12
    const capRate =
      listPrice > 0
        ? ((annualRentalIncome - annualExpenses + mortgagePayment * 12) /
            listPrice) *
          100
        : 0

    // Calculate break-even down payment %
    // Cash flow = 0 when rentalIncome = totalExpenses
    // totalExpenses = mortgagePayment + fixedCosts
    // So mortgagePayment = rentalIncome - fixedCosts
    const fixedCosts =
      propertyTaxMonthly +
      maintenanceCost +
      insuranceMonthly +
      hoaCost +
      otherCosts
    const targetMortgage = rentalIncome - fixedCosts
    let breakEvenDownPayment: number | null = null

    if (rentalIncome > 0 && targetMortgage > 0) {
      // Reverse the mortgage formula to find loan amount
      // M = L * [r(1+r)^n] / [(1+r)^n - 1]
      // L = M * [(1+r)^n - 1] / [r(1+r)^n]
      const factor =
        monthlyRate > 0
          ? (Math.pow(1 + monthlyRate, numPayments) - 1) /
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
          : numPayments

      const maxLoan = targetMortgage * factor
      const requiredDown = listPrice - maxLoan
      const requiredPercent = (requiredDown / listPrice) * 100

      if (requiredPercent >= 0 && requiredPercent <= 100) {
        breakEvenDownPayment = Math.round(requiredPercent * 10) / 10
      }
    } else if (rentalIncome > 0 && fixedCosts >= rentalIncome) {
      breakEvenDownPayment = 100
    }

    return {
      mortgagePayment,
      totalExpenses,
      monthlyCashFlow,
      annualCashFlow,
      capRate,
      breakEvenDownPayment
    }
  }, [
    listPrice,
    downPaymentPercent,
    interestRate,
    loanTerm,
    propertyTaxMonthly,
    maintenanceCost,
    insuranceMonthly,
    hoaCost,
    otherCosts,
    rentalIncome
  ])

  const chartSegments = [
    {
      label: 'Mortgage',
      value: calculations.mortgagePayment,
      color: COLORS.mortgage
    },
    { label: 'Property Tax', value: propertyTaxMonthly, color: COLORS.tax },
    { label: 'Insurance', value: insuranceMonthly, color: COLORS.insurance },
    { label: 'HOA', value: hoaCost, color: COLORS.hoa },
    { label: 'Maintenance', value: maintenanceCost, color: COLORS.maintenance },
    { label: 'Other', value: otherCosts, color: COLORS.other }
  ]

  const handleNumericChange =
    (setter: (val: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      if (!isNaN(val) && val >= 0) setter(val)
    }

  const cashFlowColor =
    calculations.monthlyCashFlow >= 0 ? '#2e7d32' : '#d32f2f'

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, border: '1px solid', borderColor: 'divider', mt: 3 }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Cash Flow Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Estimate your investment cash flow and returns
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={4}>
        {/* Left Column - Inputs */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Down Payment Slider */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" fontWeight="medium">
                  Down Payment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {downPaymentPercent}% (
                  {formatCurrency((listPrice * downPaymentPercent) / 100)})
                </Typography>
              </Stack>
              <Slider
                value={downPaymentPercent}
                onChange={(_e, v) => setDownPaymentPercent(v as number)}
                aria-label="Down payment percentage"
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}%`}
                step={5}
                marks
                min={5}
                max={100}
                sx={{
                  '& .MuiSlider-thumb': { backgroundColor: 'primary.main' },
                  '& .MuiSlider-track': { backgroundColor: 'primary.main' },
                  '& .MuiSlider-rail': { opacity: 0.3 }
                }}
              />
            </Box>

            {/* Interest Rate */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Interest Rate
              </Typography>
              <TextField
                type="number"
                value={interestRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0 && val <= 20) setInterestRate(val)
                }}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  )
                }}
                inputProps={{ step: 0.125, min: 0, max: 20 }}
              />
            </Box>

            {/* Loan Term */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" fontWeight="medium">
                  Loan Term
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {loanTerm} years
                </Typography>
              </Stack>
              <Slider
                value={loanTerm}
                onChange={(_e, v) => setLoanTerm(v as number)}
                aria-label="Loan term"
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}yr`}
                step={5}
                marks={[
                  { value: 10, label: '10' },
                  { value: 15, label: '15' },
                  { value: 20, label: '20' },
                  { value: 30, label: '30' }
                ]}
                min={10}
                max={30}
                sx={{
                  '& .MuiSlider-thumb': { backgroundColor: 'primary.main' },
                  '& .MuiSlider-track': { backgroundColor: 'primary.main' },
                  '& .MuiSlider-rail': { opacity: 0.3 }
                }}
              />
            </Box>

            {/* Mortgage Payment (read-only display) */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Mortgage Payment (monthly)
              </Typography>
              <TextField
                value={formatCurrency(calculations.mortgagePayment)}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
              />
            </Box>

            {/* Property Tax */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Property Tax (monthly)
              </Typography>
              <TextField
                type="number"
                value={propertyTaxMonthly}
                onChange={handleNumericChange(setPropertyTaxMonthly)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                inputProps={{ step: 50, min: 0 }}
              />
            </Box>

            {/* Maintenance */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Maintenance Cost (monthly)
              </Typography>
              <TextField
                type="number"
                value={maintenanceCost}
                onChange={handleNumericChange(setMaintenanceCost)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                inputProps={{ step: 50, min: 0 }}
              />
            </Box>

            {/* Insurance */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Insurance (monthly)
              </Typography>
              <TextField
                type="number"
                value={insuranceMonthly}
                onChange={handleNumericChange(setInsuranceMonthly)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                inputProps={{ step: 25, min: 0 }}
              />
            </Box>

            {/* HOA */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                HOA / Condo Fee (monthly)
              </Typography>
              <TextField
                type="number"
                value={hoaCost}
                onChange={handleNumericChange(setHoaCost)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                inputProps={{ step: 50, min: 0 }}
              />
            </Box>

            {/* Other Costs */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Other Costs (monthly)
              </Typography>
              <TextField
                type="number"
                value={otherCosts}
                onChange={handleNumericChange(setOtherCosts)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                inputProps={{ step: 25, min: 0 }}
              />
            </Box>

            {/* Rental Income */}
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Expected Rental Income (monthly)
              </Typography>
              <TextField
                type="number"
                value={rentalIncome}
                onChange={handleNumericChange(setRentalIncome)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                inputProps={{ step: 100, min: 0 }}
                placeholder="Enter expected monthly rent"
              />
            </Box>
          </Stack>
        </Grid>

        {/* Right Column - Chart + Results */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Donut Chart */}
            <CashFlowDonut
              segments={chartSegments}
              total={calculations.totalExpenses}
              centerLabel="Cash Flow"
              centerValue={formatCurrency(calculations.monthlyCashFlow)}
              centerColor={cashFlowColor}
            />

            <Divider />

            {/* Results */}
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Investment Summary
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={7}>
                  <Typography variant="body2" color="text.secondary">
                    Total Monthly Expenses
                  </Typography>
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(calculations.totalExpenses)}
                  </Typography>
                </Grid>

                <Grid item xs={7}>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Rental Income
                  </Typography>
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={COLORS.income}
                  >
                    {formatCurrency(rentalIncome)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                <Grid item xs={7}>
                  <Typography variant="body1" fontWeight="bold">
                    Monthly Cash Flow
                  </Typography>
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: cashFlowColor }}
                  >
                    {formatCurrency(calculations.monthlyCashFlow)}
                  </Typography>
                </Grid>

                <Grid item xs={7}>
                  <Typography variant="body2" color="text.secondary">
                    Annual Cash Flow
                  </Typography>
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ color: cashFlowColor }}
                  >
                    {formatCurrency(calculations.annualCashFlow)}
                  </Typography>
                </Grid>

                <Grid item xs={7}>
                  <Typography variant="body2" color="text.secondary">
                    Cap Rate
                  </Typography>
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {calculations.capRate.toFixed(2)}%
                  </Typography>
                </Grid>

                {calculations.breakEvenDownPayment !== null && (
                  <>
                    <Grid item xs={7}>
                      <Typography variant="body2" color="text.secondary">
                        Break-even Down Payment
                      </Typography>
                    </Grid>
                    <Grid item xs={5} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {calculations.breakEvenDownPayment}%
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>

            {/* Disclaimer */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                This calculator provides estimates only. Actual rental income
                and expenses may vary. Consult a financial advisor before making
                investment decisions.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default CashFlowCalculator
