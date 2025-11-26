'use client'

import React from 'react'
import { Box, Paper, Typography, Stack } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'

interface HomeWorthCheckCTAProps {
  city?: string
  state?: string
}

/**
 * Placeholder component for Home Worth Check CTA
 * User will provide the actual implementation code to plug in
 */
const HomeWorthCheckCTA: React.FC<HomeWorthCheckCTAProps> = ({
  city,
  state
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 2,
        textAlign: 'center'
      }}
    >
      <Stack spacing={2} alignItems="center">
        <InfoIcon sx={{ fontSize: 48, color: 'text.secondary' }} />

        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Home Worth Check - Placeholder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User will provide custom code to integrate here
          </Typography>
          {(city || state) && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Location: {city}, {state}
            </Typography>
          )}
        </Box>

        {/* Placeholder for user's custom content */}
        <Box
          sx={{
            width: '100%',
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {/* User can replace this entire component or add their code here */}
            This section is ready for your Home Worth Check integration
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

export default HomeWorthCheckCTA
