'use client'

import React from 'react'
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material'
import lenderConfig from '@/configs/defaults/lender'

const PreferredLender: React.FC = () => {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Chip
          label={lenderConfig.badgeLabel}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        />

        <Typography variant="h6" fontWeight={700}>
          {lenderConfig.companyName}
        </Typography>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Loan Officer: {lenderConfig.loanOfficer}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            NMLS# {lenderConfig.nmls} &middot; Company NMLS# {lenderConfig.companyNmls}
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          href={lenderConfig.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 0.5, fontWeight: 700, py: 1.25 }}
        >
          {lenderConfig.ctaLabel}
        </Button>
      </CardContent>
    </Card>
  )
}

export default PreferredLender
