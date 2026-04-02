'use client'

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

interface WalkScoreProps {
  lat: number
  lng: number
  address: string
}

const WalkScore: React.FC<WalkScoreProps> = ({ lat, lng, address }) => {
  if (!lat || !lng) return null

  const badgeUrl = `https://www.walkscore.com/serve-walkscore-badge.php?wsid=&lat=${lat}&lng=${lng}&anyresidential=1`
  const detailUrl = `https://www.walkscore.com/score/${encodeURIComponent(address)}`

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
        Walk Score
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Walk Score measures the walkability of any address based on the distance to nearby amenities.
      </Typography>
      <Box
        component="a"
        href={detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'inline-block' }}
      >
        <Box
          component="img"
          src={badgeUrl}
          alt={`Walk Score for ${address}`}
          sx={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1,
          }}
        />
      </Box>
    </Paper>
  )
}

export default WalkScore
