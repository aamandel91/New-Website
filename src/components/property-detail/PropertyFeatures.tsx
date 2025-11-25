'use client'

import React from 'react'
import { Box, Typography, Paper, Grid, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

interface Feature {
  name: string
  category?: string
}

interface PropertyFeaturesProps {
  features: Feature[] | Record<string, string[]>
}

const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({ features }) => {
  // Normalize features to categorized format
  const categorizedFeatures: Record<string, string[]> = Array.isArray(features)
    ? features.reduce((acc, feature) => {
        const category = feature.category || 'Features'
        if (!acc[category]) acc[category] = []
        acc[category].push(feature.name)
        return acc
      }, {} as Record<string, string[]>)
    : features

  const categories = Object.keys(categorizedFeatures)

  if (categories.length === 0) {
    return null
  }

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', mb: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Property Features
      </Typography>

      <Grid container spacing={4}>
        {categories.map((category) => (
          <Grid item xs={12} md={6} key={category}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="primary"
              gutterBottom
              sx={{ mb: 2 }}
            >
              {category}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {categorizedFeatures[category].map((feature, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CheckCircleIcon
                    sx={{ fontSize: 18, color: 'success.main' }}
                  />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  )
}

export default PropertyFeatures
