'use client'

import React from 'react'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

interface Property3DTourProps {
  virtualTourUrl?: string
  propertyAddress?: string
}

const Property3DTour: React.FC<Property3DTourProps> = ({
  virtualTourUrl,
  propertyAddress = 'this property'
}) => {
  if (!virtualTourUrl) {
    return null
  }

  const handleTourClick = () => {
    window.open(virtualTourUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'primary.light',
        borderRadius: 2
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        <ViewInArIcon sx={{ fontSize: 48, color: 'primary.main' }} />

        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            3D Virtual Tour Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explore {propertyAddress} from the comfort of your home with our
            immersive 3D tour
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          endIcon={<OpenInNewIcon />}
          onClick={handleTourClick}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            textTransform: 'none'
          }}
        >
          Launch 3D Tour
        </Button>
      </Stack>
    </Paper>
  )
}

export default Property3DTour
