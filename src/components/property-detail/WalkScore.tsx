'use client'

import React, { useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { DirectionsWalk as WalkIcon } from '@mui/icons-material'

interface WalkScoreProps {
  lat: number
  lng: number
  address: string
}

const WalkScore: React.FC<WalkScoreProps> = ({ lat, lng, address }) => {
  const [imgError, setImgError] = useState(false)

  if (!lat || !lng) return null

  const badgeUrl = `https://www.walkscore.com/serve-walkscore-badge.php?wsid=&lat=${lat}&lng=${lng}&anyresidential=1`
  const detailUrl = `https://www.walkscore.com/score/${lat}/${lng}`

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
        Walk Score
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Walk Score measures the walkability of any address based on the distance to nearby amenities.
      </Typography>

      {imgError ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 3,
            px: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
          }}
        >
          <WalkIcon sx={{ fontSize: 36, color: 'grey.400' }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Walk Score unavailable for this location
          </Typography>
        </Box>
      ) : (
        <Box
          component="a"
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'inline-block' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl}
            alt={`Walk Score for ${address}`}
            onError={() => setImgError(true)}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 4,
            }}
          />
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography
          component="a"
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          color="primary"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          View Walk Score details
        </Typography>
      </Box>
    </Paper>
  )
}

export default WalkScore
