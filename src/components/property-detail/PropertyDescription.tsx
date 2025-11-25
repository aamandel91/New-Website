'use client'

import React, { useState } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

interface PropertyDescriptionProps {
  description: string
  expandThreshold?: number
}

const PropertyDescription: React.FC<PropertyDescriptionProps> = ({
  description,
  expandThreshold = 500,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldShowReadMore = description.length > expandThreshold

  const displayText = shouldShowReadMore && !isExpanded
    ? `${description.substring(0, expandThreshold)}...`
    : description

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        About This Home
      </Typography>

      <Typography
        variant="body1"
        sx={{
          whiteSpace: 'pre-wrap',
          lineHeight: 1.8,
          color: 'text.secondary',
          mb: shouldShowReadMore ? 2 : 0,
        }}
      >
        {displayText}
      </Typography>

      {shouldShowReadMore && (
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ mt: 1 }}
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </Button>
      )}
    </Paper>
  )
}

export default PropertyDescription
