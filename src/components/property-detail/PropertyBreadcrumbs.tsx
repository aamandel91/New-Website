'use client'

import React from 'react'
import { Breadcrumbs, Link, Typography, Box } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'

interface PropertyBreadcrumbsProps {
  state?: string
  city?: string
  street?: string
  baseUrl?: string
}

const PropertyBreadcrumbs: React.FC<PropertyBreadcrumbsProps> = ({
  state,
  city,
  street,
  baseUrl = ''
}) => {
  return (
    <Box sx={{ py: 2, px: { xs: 2, md: 0 } }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          }
        }}
      >
        <Link
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main'
            }
          }}
          href={baseUrl || '/'}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>

        {state && (
          <Link
            underline="hover"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
            href={`${baseUrl}/search?state=${state}`}
          >
            {state}
          </Link>
        )}

        {city && (
          <Link
            underline="hover"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
            href={`${baseUrl}/search?city=${city}&state=${state}`}
          >
            {city}
          </Link>
        )}

        {street && (
          <Typography color="text.primary" fontWeight="medium">
            {street}
          </Typography>
        )}
      </Breadcrumbs>
    </Box>
  )
}

export default PropertyBreadcrumbs
